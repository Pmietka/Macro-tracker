import React, { useState, useMemo } from 'react'
import { X, Plus, Trash2, ChefHat } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store/useStore'
import { FOOD_DATABASE, searchFoods } from '../data/foodDatabase'
import { Food } from '../types'

interface Ingredient {
  food: Food
  amount: number   // grams or the food's native unit × this factor
}

interface Props {
  onClose: () => void
}

export const RecipeBuilder: React.FC<Props> = ({ onClose }) => {
  const [name, setName] = useState('')
  const [servingsYield, setServingsYield] = useState(1)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(false)

  const addCustomFood = useStore(s => s.addCustomFood)
  const customFoods   = useStore(s => s.customFoods)

  const results = useMemo(() => {
    if (!query) return []
    const db = searchFoods(query, 10)
    const custom = customFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    return [...db, ...custom].slice(0, 12)
  }, [query, customFoods])

  const addIngredient = (food: Food) => {
    setIngredients(prev => [...prev, { food, amount: food.servingSize }])
    setQuery('')
  }

  const updateAmount = (idx: number, val: string) => {
    const n = parseFloat(val)
    if (n > 0) setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, amount: n } : ing))
  }

  const remove = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx))

  // Totals (for the whole recipe, then divide by yield for per-serving)
  const totals = useMemo(() => {
    return ingredients.reduce((acc, ing) => {
      const ratio = ing.amount / ing.food.servingSize
      return {
        calories: acc.calories + ing.food.calories * ratio,
        protein:  acc.protein  + ing.food.protein  * ratio,
        carbs:    acc.carbs    + ing.food.carbs     * ratio,
        fat:      acc.fat      + ing.food.fat       * ratio,
        fiber:    acc.fiber    + ing.food.fiber     * ratio,
        sugar:    acc.sugar    + ing.food.sugar     * ratio,
        sodium:   acc.sodium   + ing.food.sodium    * ratio,
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })
  }, [ingredients])

  const perServing = {
    calories: Math.round(totals.calories / Math.max(servingsYield, 1)),
    protein:  +(totals.protein  / Math.max(servingsYield, 1)).toFixed(1),
    carbs:    +(totals.carbs    / Math.max(servingsYield, 1)).toFixed(1),
    fat:      +(totals.fat      / Math.max(servingsYield, 1)).toFixed(1),
    fiber:    +(totals.fiber    / Math.max(servingsYield, 1)).toFixed(1),
    sugar:    +(totals.sugar    / Math.max(servingsYield, 1)).toFixed(1),
    sodium:   Math.round(totals.sodium / Math.max(servingsYield, 1)),
  }

  const handleSave = () => {
    if (!name.trim() || ingredients.length === 0) return
    addCustomFood({
      name: name.trim(),
      category: 'Custom',
      servingSize: 1,
      servingUnit: 'serving',
      ...perServing,
      potassium: 0, cholesterol: 0, saturatedFat: 0, transFat: 0,
      vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0,
    })
    setSaved(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900 animate-slide-up">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-4 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
        <ChefHat className="w-5 h-5 text-green-500" />
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">Recipe Builder</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Recipe name + yield */}
        <div className="card p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Recipe Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chicken Fried Rice"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Servings this recipe makes</label>
            <input
              type="number"
              min="1"
              value={servingsYield}
              onChange={e => setServingsYield(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field w-24"
            />
          </div>
        </div>

        {/* Ingredient search */}
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Ingredients</p>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search foods..."
            className="input-field"
          />
          {results.length > 0 && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
              {results.map(food => (
                <button
                  key={food.id}
                  onClick={() => addIngredient(food)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-100">{food.name}</span>
                  <span className="text-xs text-gray-400">{food.calories} kcal/{food.servingSize}{food.servingUnit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ingredient list */}
        {ingredients.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Ingredients ({ingredients.length})</p>
            </div>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{ing.food.name}</p>
                  <p className="text-xs text-gray-400">{ing.food.servingUnit} unit</p>
                </div>
                <input
                  type="number"
                  value={ing.amount}
                  min="0.1" step="0.1"
                  onChange={e => updateAmount(idx, e.target.value)}
                  className="input-field w-20 text-center py-1 text-sm"
                />
                <span className="text-xs text-gray-400 w-8">{ing.food.servingUnit}</span>
                <button onClick={() => remove(idx)} className="btn-icon p-1.5 text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Per-serving macros preview */}
        {ingredients.length > 0 && (
          <div className="card p-4">
            <p className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Per Serving ({servingsYield} total)
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <MacroCell label="Calories" value={String(perServing.calories)} color="text-primary-500" />
              <MacroCell label="Protein"  value={`${perServing.protein}g`}  color="text-blue-500" />
              <MacroCell label="Carbs"    value={`${perServing.carbs}g`}    color="text-amber-500" />
              <MacroCell label="Fat"      value={`${perServing.fat}g`}      color="text-red-400" />
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!name.trim() || ingredients.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          {saved ? 'Saved to Custom Foods!' : 'Save Recipe as Custom Food'}
        </button>
      </div>
    </div>
  )
}

const MacroCell: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl py-2">
    <p className={`font-bold text-sm ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
  </div>
)
