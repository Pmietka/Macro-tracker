import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: { imageBase64: string; mealType?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { imageBase64, mealType } = body

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analyze every food item visible in this photo. For each item estimate the quantity and macros.
Meal context: ${mealType ?? 'unknown'}.

Respond with ONLY a JSON array, no markdown fences:
[{"name":"...","servings":1,"servingSize":100,"servingUnit":"g","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"sodium":0,"category":"Custom"}]

Use accurate USDA-based values. Account for cooking methods (oil, butter). If multiple foods are on the plate log each separately.`,
          },
        ],
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? '[]'
    let foods: unknown[] = []
    try {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) foods = JSON.parse(match[0])
    } catch { /* return empty */ }

    return new Response(JSON.stringify({ foods }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
