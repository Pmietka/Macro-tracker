import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Camera, Lightbulb } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../../store/useStore'
import { getTodayString } from '../../utils/calculations'
import { Food, FoodCategory, MealType } from '../../types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
  actions?: LoggedAction[]
}

interface LoggedAction {
  type: 'food' | 'weight' | 'water'
  summary: string
}

// API message format for Anthropic
interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

export const ChatInterface: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your nutrition assistant. Tell me what you ate, your weight, or water intake and I'll log it automatically. Try: \"I had 1 cup of oatmeal and 2 eggs for breakfast\" or \"I weighed 185 lbs this morning\".",
      timestamp: Date.now(),
    },
  ])

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const { goals, diary, currentWeightKg, profile, addFoodEntry, removeFoodEntry, addWeightEntry, addWater, updateStreak } = useStore()

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const getTodayCalories = () => {
    const day = diary[getTodayString()]
    if (!day) return 0
    return day.entries.reduce((sum, e) => sum + e.food.calories * e.servings, 0)
  }

  const getTodayEntries = () => {
    const day = diary[getTodayString()]
    if (!day) return []
    return day.entries.map(e => ({
      id: e.id,
      name: e.food.name,
      meal: e.mealType,
      calories: e.food.calories * e.servings,
    }))
  }

  const compressToBase64 = (file: File): Promise<string> =>
    new Promise(resolve => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const max = 1024
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.75).split(',')[1])
      }
      img.src = url
    })

  const handlePhotoUpload = async (file: File) => {
    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text: '📷 Analyzing meal photo…', timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const imageBase64 = await compressToBase64(file)
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mealType: 'unknown' }),
      })
      const data = await res.json()
      const today = getTodayString()
      const loggedActions: LoggedAction[] = []

      for (const inp of (data.foods ?? [])) {
        const food: Food = {
          id: `photo_${uuidv4()}`,
          name: inp.name,
          category: (inp.category ?? 'Custom') as FoodCategory,
          servingSize: inp.servingSize,
          servingUnit: inp.servingUnit,
          calories: inp.calories / inp.servings,
          protein:  inp.protein  / inp.servings,
          carbs:    inp.carbs    / inp.servings,
          fat:      inp.fat      / inp.servings,
          fiber:    inp.fiber    / inp.servings,
          sugar:    inp.sugar    / inp.servings,
          sodium:   inp.sodium   / inp.servings,
          potassium: 0, cholesterol: 0, saturatedFat: 0, transFat: 0,
          vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0,
          isCustom: true,
        }
        addFoodEntry(today, { foodId: food.id, food, servings: inp.servings, mealType: 'Lunch' as MealType })
        loggedActions.push({ type: 'food', summary: `${inp.name} — ${Math.round(inp.calories)} kcal` })
      }
      if (loggedActions.length > 0) updateStreak()

      const text = loggedActions.length > 0
        ? `Logged ${loggedActions.length} item${loggedActions.length > 1 ? 's' : ''} from your photo.`
        : "I couldn't identify food in that photo. Try a clearer shot."

      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', text, timestamp: Date.now(), actions: loggedActions }])
    } catch {
      setMessages(prev => [...prev, { id: uuidv4(), role: 'assistant', text: 'Photo analysis failed. Try again.', timestamp: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { id: uuidv4(), role: 'user', text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Build API message history (exclude welcome message, use only real conversation)
    const apiMessages: ApiMessage[] = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.text }))
    apiMessages.push({ role: 'user', content: text })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            goals: { calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat },
            todayCalories: Math.round(getTodayCalories()),
            todayEntries: getTodayEntries(),
            currentWeight: `${(currentWeightKg * (profile.weightUnit === 'lbs' ? 2.20462 : 1)).toFixed(1)} ${profile.weightUnit}`,
            weightUnit: profile.weightUnit,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      // Execute the actions returned by Claude
      const loggedActions: LoggedAction[] = []
      const today = getTodayString()

      for (const action of data.actions ?? []) {
        if (action.tool === 'log_food') {
          const inp = action.input as {
            name: string; meal: string; servings: number
            servingSize: number; servingUnit: string
            calories: number; protein: number; carbs: number; fat: number
            fiber: number; sugar: number; sodium: number; category: string
          }

          const food: Food = {
            id: `chat_${uuidv4()}`,
            name: inp.name,
            category: inp.category as FoodCategory,
            servingSize: inp.servingSize,
            servingUnit: inp.servingUnit,
            calories: inp.calories / inp.servings,   // per-serving values
            protein: inp.protein / inp.servings,
            carbs: inp.carbs / inp.servings,
            fat: inp.fat / inp.servings,
            fiber: inp.fiber / inp.servings,
            sugar: inp.sugar / inp.servings,
            sodium: inp.sodium / inp.servings,
            potassium: 0,
            cholesterol: 0,
            saturatedFat: 0,
            transFat: 0,
            vitaminA: 0,
            vitaminC: 0,
            calcium: 0,
            iron: 0,
            isCustom: true,
          }

          addFoodEntry(today, {
            foodId: food.id,
            food,
            servings: inp.servings,
            mealType: inp.meal as MealType,
          })

          loggedActions.push({
            type: 'food',
            summary: `${inp.name} — ${Math.round(inp.calories)} kcal`,
          })
        }

        if (action.tool === 'remove_food') {
          const inp = action.input as { entry_id: string }
          removeFoodEntry(today, inp.entry_id)
          // no chip shown — it's a silent correction step
        }

        if (action.tool === 'log_weight') {
          const inp = action.input as { weight: number; unit: string; bodyFat?: number }
          addWeightEntry({
            date: today,
            weight: inp.weight,
            bodyFat: inp.bodyFat,
          })
          loggedActions.push({ type: 'weight', summary: `${inp.weight} ${inp.unit}` })
        }

        if (action.tool === 'log_water') {
          const inp = action.input as { amount_ml: number }
          addWater(today, Math.round(inp.amount_ml))
          loggedActions.push({ type: 'water', summary: `${Math.round(inp.amount_ml)} ml` })
        }
      }

      if (loggedActions.length > 0) updateStreak()

      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        text: data.text || 'Done!',
        timestamp: Date.now(),
        actions: loggedActions,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'assistant', text: `Sorry, I ran into an error: ${errMsg}`, timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const actionIcon = (type: LoggedAction['type']) =>
    type === 'food' ? '🍽️' : type === 'weight' ? '⚖️' : '💧'

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95"
        aria-label="Open nutrition assistant"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-12rem))] flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-green-500 text-white shrink-0">
            <Bot className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm leading-tight">Nutrition Assistant</p>
              <p className="text-xs text-green-100 leading-tight">Powered by Claude AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs mt-0.5 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>

                  {/* Logged actions chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {msg.actions.map((a, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 px-2 py-0.5 rounded-full">
                          {actionIcon(a.type)} {a.summary}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="shrink-0 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-700">
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 space-y-2">
            {/* Quick actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setInput('What should I eat to hit my remaining macros today?')}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700"
              >
                <Lightbulb className="w-3 h-3" /> Suggest a meal
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { handlePhotoUpload(f) } e.target.value = '' }}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 disabled:opacity-40"
              >
                <Camera className="w-3 h-3" /> Photo
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="What did you eat? Log weight, water…"
                className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
