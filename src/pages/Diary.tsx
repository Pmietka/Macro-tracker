import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, ChevronLeft, ChevronRight, Copy, Dumbbell, ChevronDown, ChevronUp, Edit2, ChefHat, Bookmark } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Navbar } from '../components/Layout/Navbar'
import { FoodSearchModal } from '../components/FoodSearchModal'
import { RecipeBuilder } from '../components/RecipeBuilder'
import { MealType, FoodEntry } from '../types'
import { getDayNutrition, getTodayString, formatDate, getDateString } from '../utils/calculations'
import { EXERCISE_DATABASE } from '../data/foodDatabase'

const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-Workout', 'Post-Workout']

const mealEmojis: Record<string, string> = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎',
  'Pre-Workout': '⚡', 'Post-Workout': '💪'
}

export const Diary: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [currentDate, setCurrentDate] = useState(getTodayString())
  const [showSearch, setShowSearch] = useState(false)
  const [showRecipe, setShowRecipe] = useState(false)
  const [activeMeal, setActiveMeal] = useState<MealType>(
    (searchParams.get('meal') as MealType) || 'Breakfast'
  )
  const [showExercise, setShowExercise] = useState(false)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(['Breakfast', 'Lunch', 'Dinner', 'Snacks']))
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editServings, setEditServings] = useState('')

  const day = useStore(s => s.diary[currentDate] ?? { date: currentDate, entries: [], waterIntake: 0, exercises: [] })
  const goals = useStore(s => s.goals)
  const removeFoodEntry = useStore(s => s.removeFoodEntry)
  const removeExerciseEntry = useStore(s => s.removeExerciseEntry)
  const updateFoodEntry = useStore(s => s.updateFoodEntry)
  const copyDayEntries = useStore(s => s.copyDayEntries)
  const copyMealEntries = useStore(s => s.copyMealEntries)
  const mealTemplates = useStore(s => s.mealTemplates)
  const applyMealTemplate = useStore(s => s.applyMealTemplate)
  const currentWeightKg = useStore(s => s.currentWeightKg)
  const addExerciseEntry = useStore(s => s.addExerciseEntry)

  const nutrition = useMemo(() => getDayNutrition(day), [day])

  const isToday = currentDate === getTodayString()

  const navigateDate = (dir: -1 | 1) => {
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() + dir)
    setCurrentDate(getDateString(d))
  }

  const toggleMeal = (meal: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev)
      if (next.has(meal)) next.delete(meal)
      else next.add(meal)
      return next
    })
  }

  const handleCopyYesterday = () => {
    const d = new Date(currentDate + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    copyDayEntries(getDateString(d), currentDate)
  }

  const startEdit = (entry: FoodEntry) => {
    setEditingEntry(entry.id)
    setEditServings(String(entry.servings))
  }

  const saveEdit = (entryId: string) => {
    const servings = parseFloat(editServings)
    if (servings > 0) updateFoodEntry(currentDate, entryId, servings)
    setEditingEntry(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        title="Food Diary"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowRecipe(true)}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
            >
              <ChefHat className="w-3.5 h-3.5" /> Recipe
            </button>
            <button
              onClick={handleCopyYesterday}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Yesterday
            </button>
          </div>
        }
      />

      {/* Date navigator */}
      <div className="sticky top-14 z-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigateDate(-1)} className="btn-icon">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(getTodayString())}
            className="font-semibold text-gray-900 dark:text-gray-100 text-sm"
          >
            {isToday ? 'Today' : formatDate(currentDate)} · {currentDate}
          </button>
          <button
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className="btn-icon disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="page-container space-y-4">

        {/* Quick-add favorites (meal templates) */}
        {mealTemplates.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Bookmark className="w-3 h-3" /> Quick Add
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {mealTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { applyMealTemplate(t.id, currentDate) }}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:border-primary-400 hover:text-primary-600 transition-colors shadow-sm"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily summary strip */}
        <div className="card p-3">
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            <SummaryCell label="Calories" value={`${nutrition.calories}`} goal={`${goals.calories}`} isOver={nutrition.calories > goals.calories} />
            <SummaryCell label="Protein" value={`${nutrition.protein.toFixed(0)}g`} goal={`${goals.protein}g`} isOver={false} />
            <SummaryCell label="Carbs" value={`${nutrition.carbs.toFixed(0)}g`} goal={`${goals.carbs}g`} isOver={false} />
            <SummaryCell label="Fat" value={`${nutrition.fat.toFixed(0)}g`} goal={`${goals.fat}g`} isOver={false} />
            <SummaryCell label="Fiber" value={`${nutrition.fiber.toFixed(0)}g`} goal={`${goals.fiber}g`} isOver={false} />
          </div>
        </div>

        {/* Meal sections */}
        {MEALS.map(meal => {
          const entries = day.entries.filter(e => e.mealType === meal)
          const mealCals = entries.reduce((sum, e) => sum + e.food.calories * e.servings, 0)
          const isExpanded = expandedMeals.has(meal)

          return (
            <div key={meal} className="card overflow-hidden">
              {/* Meal header */}
              <button
                onClick={() => toggleMeal(meal)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{mealEmojis[meal]}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{meal}</p>
                    <p className="text-xs text-gray-400">{entries.length} item{entries.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {mealCals > 0 ? `${Math.round(mealCals)} kcal` : ''}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      const yesterday = new Date(currentDate + 'T12:00:00')
                      yesterday.setDate(yesterday.getDate() - 1)
                      copyMealEntries(getDateString(yesterday), currentDate, meal)
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title={`Copy yesterday's ${meal}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {/* Food entries */}
              {isExpanded && (
                <div className="border-t dark:border-gray-700">
                  {entries.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No foods logged</p>
                  )}

                  {entries.map(entry => (
                    <div key={entry.id} className="px-4 py-3 border-b dark:border-gray-700 last:border-0">
                      {editingEntry === entry.id ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{entry.food.name}</p>
                          </div>
                          <input
                            type="number"
                            value={editServings}
                            onChange={e => setEditServings(e.target.value)}
                            className="input-field w-20 py-1 text-sm text-center"
                            min="0.25" step="0.25"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(entry.id)} className="btn-primary py-1 px-3 text-sm">Save</button>
                          <button onClick={() => setEditingEntry(null)} className="btn-secondary py-1 px-3 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{entry.food.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.servings} × {entry.food.servingSize}{entry.food.servingUnit}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-blue-500">P: {(entry.food.protein * entry.servings).toFixed(1)}g</span>
                              <span className="text-xs text-amber-500">C: {(entry.food.carbs * entry.servings).toFixed(1)}g</span>
                              <span className="text-xs text-red-400">F: {(entry.food.fat * entry.servings).toFixed(1)}g</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-right mr-1">
                              <p className="font-semibold text-primary-500 text-sm">
                                {Math.round(entry.food.calories * entry.servings)}
                              </p>
                              <p className="text-xs text-gray-400">kcal</p>
                            </div>
                            <button onClick={() => startEdit(entry)} className="btn-icon p-1.5">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => removeFoodEntry(currentDate, entry.id)} className="btn-icon p-1.5 text-red-400 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add food button */}
                  <button
                    onClick={() => { setActiveMeal(meal); setShowSearch(true) }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add food to {meal}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Exercise section */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowExercise(!showExercise)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <Dumbbell className="w-5 h-5 text-orange-500" />
              <div className="text-left">
                <p className="font-semibold text-gray-800 dark:text-gray-100">Exercise</p>
                <p className="text-xs text-gray-400">{day.exercises.length} activities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {nutrition.caloriesBurned > 0 && (
                <span className="text-orange-500 font-semibold">-{nutrition.caloriesBurned} kcal</span>
              )}
              {showExercise ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {showExercise && (
            <div className="border-t dark:border-gray-700">
              {day.exercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{ex.exercise.name}</p>
                    <p className="text-xs text-gray-400">{ex.durationMinutes} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-semibold text-sm">-{ex.caloriesBurned} kcal</span>
                    <button onClick={() => removeExerciseEntry(currentDate, ex.id)} className="btn-icon p-1.5 text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <ExerciseLogger date={currentDate} weightKg={currentWeightKg} />
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <FoodSearchModal
          date={currentDate}
          mealType={activeMeal}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showRecipe && <RecipeBuilder onClose={() => setShowRecipe(false)} />}
    </div>
  )
}

const SummaryCell: React.FC<{ label: string; value: string; goal: string; isOver: boolean }> = ({ label, value, goal, isOver }) => (
  <div>
    <p className={`font-bold text-sm ${isOver ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    <p className="text-gray-400 text-xs">{goal}</p>
    <p className="text-gray-400 text-xs mt-0.5">{label}</p>
  </div>
)

const ExerciseLogger: React.FC<{ date: string; weightKg: number }> = ({ date, weightKg }) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')
  const [duration, setDuration] = useState('30')
  const addExerciseEntry = useStore(s => s.addExerciseEntry)

  const filtered = EXERCISE_DATABASE.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10)

  const handleAdd = () => {
    const ex = EXERCISE_DATABASE.find(e => e.id === selected)
    if (!ex || !duration) return
    addExerciseEntry(date, ex, parseInt(duration), weightKg)
    setSelected(''); setQuery(''); setDuration('30')
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search exercises..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input-field flex-1 text-sm py-2"
        />
        <input
          type="number"
          placeholder="Min"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="input-field w-20 text-sm py-2 text-center"
          min="1"
        />
      </div>

      {query && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSelected(ex.id); setQuery(ex.name) }}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                selected === ex.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="font-medium">{ex.name}</span>
              <span className="text-gray-400 ml-2 text-xs">{ex.category}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!selected}
        className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Log Exercise
      </button>
    </div>
  )
}
