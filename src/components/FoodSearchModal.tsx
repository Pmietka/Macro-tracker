import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Camera, Plus, Info, Clock, Star } from 'lucide-react'
import { Food, MealType } from '../types'
import { FOOD_DATABASE, searchFoods } from '../data/foodDatabase'
import { useStore } from '../store/useStore'
import { NutritionLabel } from './NutritionLabel'

interface FoodSearchModalProps {
  date: string
  mealType: MealType
  onClose: () => void
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({ date, mealType, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showNutrition, setShowNutrition] = useState<Food | null>(null)
  const [servings, setServings] = useState('1')
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'custom'>('search')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFoodEntry = useStore(s => s.addFoodEntry)
  const recentFoodIds = useStore(s => s.recentFoodIds)
  const customFoods = useStore(s => s.customFoods)
  const updateStreak = useStore(s => s.updateStreak)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    if (activeTab === 'recent') {
      return recentFoodIds
        .map(id => [...FOOD_DATABASE, ...customFoods].find(f => f.id === id))
        .filter(Boolean) as Food[]
    }
    if (activeTab === 'custom') return customFoods
    return searchFoods(query, 30)
  }, [query, activeTab, recentFoodIds, customFoods])

  const handleAdd = () => {
    if (!selectedFood) return
    const numServings = parseFloat(servings) || 1
    addFoodEntry(date, {
      foodId: selectedFood.id,
      food: selectedFood,
      servings: numServings,
      mealType,
    })
    updateStreak()
    setSelectedFood(null)
    setServings('1')
    setQuery('')
    inputRef.current?.focus()
  }

  if (showNutrition) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 modal-backdrop" onClick={() => setShowNutrition(null)} />
        <div className="relative w-full sm:max-w-sm mx-auto sm:rounded-2xl overflow-hidden animate-slide-up p-4">
          <NutritionLabel food={showNutrition} servings={1} onClose={() => setShowNutrition(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900 animate-slide-up">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
            Add to {mealType}
          </h2>
          <button className="btn-icon" title="Scan barcode">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search foods..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveTab('search') }}
            className="input-field pl-9 pr-4"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {(['search', 'recent', 'custom'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {tab === 'recent' && <Clock className="w-3 h-3 inline mr-1" />}
              {tab === 'custom' && <Star className="w-3 h-3 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Food list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {results.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No foods found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {results.map(food => (
          <div
            key={food.id}
            className={`card p-3 cursor-pointer transition-all ${
              selectedFood?.id === food.id
                ? 'ring-2 ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedFood(selectedFood?.id === food.id ? null : food)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{food.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {food.brand ? `${food.brand} · ` : ''}{food.servingSize}{food.servingUnit}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setShowNutrition(food) }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <div className="font-bold text-primary-500">{food.calories}</div>
                  <div className="text-xs text-gray-400">kcal</div>
                </div>
              </div>
            </div>

            {/* Macro pills */}
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                P: {food.protein.toFixed(1)}g
              </span>
              <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">
                C: {food.carbs.toFixed(1)}g
              </span>
              <span className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full">
                F: {food.fat.toFixed(1)}g
              </span>
            </div>

            {/* Servings input (shown when selected) */}
            {selectedFood?.id === food.id && (
              <div className="mt-3 flex items-center gap-3 animate-fade-in">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={e => { e.stopPropagation(); setServings(s => String(Math.max(0.25, parseFloat(s) - 0.25))) }}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                  >-</button>
                  <input
                    type="number"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    min="0.25" step="0.25"
                    className="input-field text-center w-20 py-1.5"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); setServings(s => String(parseFloat(s) + 0.25)) }}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200"
                  >+</button>
                  <span className="text-sm text-gray-500">servings</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleAdd() }}
                  className="btn-primary flex items-center gap-1 py-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
