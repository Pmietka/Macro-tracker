import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const tools: Anthropic.Tool[] = [
  {
    name: 'log_food',
    description: 'Log one food item to the diary. Call this once per distinct food item mentioned.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Descriptive name of the food' },
        meal: {
          type: 'string',
          enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-Workout', 'Post-Workout'],
          description: 'Meal category. Guess based on context or time if not stated.',
        },
        servings: { type: 'number', description: 'Number of servings consumed' },
        servingSize: { type: 'number', description: 'Size of one serving (numeric)' },
        servingUnit: { type: 'string', description: 'Unit for serving size, e.g. g, oz, cup, lb, ml' },
        calories: { type: 'number', description: 'Total calories for this entry (servings × per-serving calories)' },
        protein: { type: 'number', description: 'Total protein in grams for this entry' },
        carbs: { type: 'number', description: 'Total carbohydrates in grams for this entry' },
        fat: { type: 'number', description: 'Total fat in grams for this entry' },
        fiber: { type: 'number', description: 'Total fiber in grams for this entry' },
        sugar: { type: 'number', description: 'Total sugar in grams for this entry' },
        sodium: { type: 'number', description: 'Total sodium in mg for this entry' },
        category: {
          type: 'string',
          enum: [
            'Fruits', 'Vegetables', 'Grains & Cereals', 'Dairy',
            'Meat & Poultry', 'Fish & Seafood', 'Legumes', 'Nuts & Seeds',
            'Beverages', 'Snacks', 'Fast Food', 'Condiments', 'Oils & Fats',
            'Sweets & Desserts', 'Custom',
          ],
          description: 'Food category',
        },
      },
      required: ['name', 'meal', 'servings', 'servingSize', 'servingUnit', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'category'],
    },
  },
  {
    name: 'log_weight',
    description: 'Log a body weight measurement',
    input_schema: {
      type: 'object' as const,
      properties: {
        weight: { type: 'number', description: 'Weight value' },
        unit: { type: 'string', enum: ['lbs', 'kg'], description: 'Unit of weight' },
        bodyFat: { type: 'number', description: 'Body fat percentage (optional)' },
      },
      required: ['weight', 'unit'],
    },
  },
  {
    name: 'log_water',
    description: 'Log water or fluid intake',
    input_schema: {
      type: 'object' as const,
      properties: {
        amount_ml: { type: 'number', description: 'Amount in milliliters. Convert from oz or cups if needed.' },
      },
      required: ['amount_ml'],
    },
  },
  {
    name: 'remove_food',
    description: 'Remove a previously logged food entry by its ID. Use this when the user wants to correct, replace, or delete a food they already logged today.',
    input_schema: {
      type: 'object' as const,
      properties: {
        entry_id: { type: 'string', description: 'The ID of the diary entry to remove, from the list of today\'s logged entries.' },
      },
      required: ['entry_id'],
    },
  },
]

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: { messages: Anthropic.MessageParam[]; context: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { messages, context } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 })
  }

  const todayEntries = (context?.todayEntries as Array<{ id: string; name: string; meal: string; calories: number }> | undefined) ?? []
  const entriesList = todayEntries.length > 0
    ? todayEntries.map(e => `  - [${e.id}] ${e.name} (${e.meal}, ${Math.round(e.calories)} kcal)`).join('\n')
    : '  (none yet)'

  const systemPrompt = `You are a friendly fitness and nutrition assistant built into a macro tracker app called MacroFit.

USER CONTEXT:
- Calorie goal: ${context?.goals?.calories ?? 2000} kcal/day
- Protein goal: ${context?.goals?.protein ?? 150}g | Carbs: ${context?.goals?.carbs ?? 200}g | Fat: ${context?.goals?.fat ?? 65}g
- Calories logged today: ${context?.todayCalories ?? 0} kcal
- Current weight: ${context?.currentWeight ?? 'not set'}
- Weight unit preference: ${context?.weightUnit ?? 'lbs'}

TODAY'S LOGGED ENTRIES (with IDs):
${entriesList}

RULES:
1. When the user describes food they ate, call log_food for EACH distinct food item. Provide accurate macro values using your nutrition knowledge.
2. When cooking oils/fats are mentioned (e.g. "cooked in olive oil"), log them separately as their own entry.
3. For the "calories", "protein", "carbs", "fat", etc. fields — provide the TOTAL for the quantity described (not per 100g).
4. servingSize + servingUnit should describe what ONE serving is. servings is how many of those they ate.
5. When the user mentions their weight, call log_weight.
6. When the user mentions drinking water or any fluid, call log_water.
7. After using tools, give a short friendly summary of what was logged with the totals.
8. If the user asks a general nutrition question, answer it without logging anything.
9. If the meal type isn't mentioned, pick the most logical one based on context.
10. CRITICAL — when the user corrects, refines, or replaces a food they already logged (e.g. "actually it was 93/7 beef", "change that to 2 cups", "remove the ground beef"): call remove_food with the matching entry ID first, then call log_food with the corrected details. NEVER add a new entry without removing the old one when the intent is a correction. Match the entry by name/context from TODAY'S LOGGED ENTRIES above.`

  try {
    const actions: Array<{ tool: string; input: Record<string, unknown> }> = []
    let assistantBlocks: Anthropic.ContentBlock[] = []

    // First turn
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })

    assistantBlocks = response.content

    // Collect tool calls
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        actions.push({ tool: block.name, input: block.input as Record<string, unknown> })
      }
    }

    // If Claude used tools, feed back results and get final text
    let finalText = ''
    if (actions.length > 0 && response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result' as const,
          tool_use_id: b.id,
          content: 'Logged successfully.',
        }))

      const followUp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: assistantBlocks },
          { role: 'user', content: toolResults },
        ],
      })

      for (const block of followUp.content) {
        if (block.type === 'text') finalText += block.text
      }
    } else {
      for (const block of response.content) {
        if (block.type === 'text') finalText += block.text
      }
    }

    return new Response(JSON.stringify({ text: finalText, actions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
