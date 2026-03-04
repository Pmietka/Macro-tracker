import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Flame, Zap, Dumbbell, ChevronRight, TrendingUp, Award } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Navbar } from '../components/Layout/Navbar'
import { MacroRing } from '../components/MacroRing'
import { MacroBar } from '../components/MacroBar'
import { WaterTracker } from '../components/WaterTracker'
import { FastingTimer } from '../components/FastingTimer'
import { getDayNutrition, getTodayString, formatDate } from '../utils/calculations'

export const Dashboard: React.FC = () => {
  const today = getTodayString()
  const day = useStore(s => s.diary[today] ?? { date: today, entries: [], waterIntake: 0, exercises: [] })
  const goals = useStore(s => s.goals)
  const streak = useStore(s => s.streak)
  const weightLog = useStore(s => s.weightLog)
  const profile = useStore(s => s.profile)

  const nutrition = useMemo(() => getDayNutrition(day), [day])

  const mealTotals = useMemo(() => {
    const meals: Record<string, { calories: number; count: number }> = {}
    for (const entry of day.entries) {
      if (!meals[entry.mealType]) meals[entry.mealType] = { calories: 0, count: 0 }
      meals[entry.mealType].calories += entry.food.calories * entry.servings
      meals[entry.mealType].count++
    }
    return meals
  }, [day])

  const caloriePct = Math.round((nutrition.calories / goals.calories) * 100)
  const latestWeight = weightLog[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        subtitle={formatDate(today) + ' · ' + new Date().toLocaleDateString('en-US', { weekday: 'long' })}
      />

      <div className="page-container space-y-4">

        {/* Calorie summary card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Today's Summary</h2>
            <Link to="/diary" className="text-xs text-primary-500 font-medium flex items-center gap-1">
              View Diary <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center justify-between gap-4">
            <MacroRing
              calories={nutrition.calories}
              goal={goals.calories}
              protein={nutrition.protein}
              carbs={nutrition.carbs}
              fat={nutrition.fat}
              size={160}
            />

            {/* Calorie budget */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatBox
                  label="Goal"
                  value={goals.calories}
                  unit="kcal"
                  color="text-gray-600 dark:text-gray-300"
                />
                <StatBox
                  label="Eaten"
                  value={nutrition.calories}
                  unit="kcal"
                  color="text-primary-500"
                />
                <StatBox
                  label="Burned"
                  value={nutrition.caloriesBurned}
                  unit="kcal"
                  color="text-orange-500"
                />
              </div>

              <div className="border-t dark:border-gray-700 pt-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Net Calories</p>
                  <p className={`text-2xl font-bold ${
                    nutrition.netCalories > goals.calories ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {nutrition.netCalories}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {goals.calories - nutrition.netCalories > 0
                      ? `${goals.calories - nutrition.netCalories} remaining`
                      : `${Math.abs(goals.calories - nutrition.netCalories)} over budget`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Macros card */}
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Macronutrients</h3>
          <MacroBar
            label="Protein"
            current={nutrition.protein}
            goal={goals.protein}
            color="macro-protein"
            bgColor="bg-macro-protein"
          />
          <MacroBar
            label="Carbohydrates"
            current={nutrition.carbs}
            goal={goals.carbs}
            color="macro-carbs"
            bgColor="bg-macro-carbs"
          />
          <MacroBar
            label="Fat"
            current={nutrition.fat}
            goal={goals.fat}
            color="macro-fat"
            bgColor="bg-macro-fat"
          />
          <MacroBar
            label="Fiber"
            current={nutrition.fiber}
            goal={goals.fiber}
            color="macro-fiber"
            bgColor="bg-macro-fiber"
          />
        </div>

        {/* Meals quick view */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Meals</h3>
            <Link to="/diary" className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Food
            </Link>
          </div>

          {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map(meal => {
            const data = mealTotals[meal]
            return (
              <Link key={meal} to={`/diary?meal=${meal}`} className="block">
                <div className="flex items-center justify-between py-2.5 border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-1 px-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${mealColors[meal]}`}>
                      {mealEmojis[meal]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{meal}</p>
                      {data && <p className="text-xs text-gray-400">{data.count} item{data.count !== 1 ? 's' : ''}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${data ? 'text-gray-700 dark:text-gray-200' : 'text-gray-300 dark:text-gray-600'}`}>
                      {data ? `${Math.round(data.calories)} kcal` : '—'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Water tracker */}
        <WaterTracker date={today} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{streak.current}</div>
            <div className="text-xs text-gray-500">Day Streak</div>
          </div>
          <div className="card p-3 text-center">
            <Dumbbell className="w-5 h-5 text-primary-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{nutrition.caloriesBurned}</div>
            <div className="text-xs text-gray-500">Cal Burned</div>
          </div>
          <div className="card p-3 text-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {latestWeight ? `${latestWeight.weight}` : '—'}
            </div>
            <div className="text-xs text-gray-500">{profile.weightUnit}</div>
          </div>
        </div>

        {/* Micronutrients */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Micronutrients</h3>
          <div className="grid grid-cols-2 gap-2">
            <MicroRow label="Sodium" current={nutrition.sodium} goal={goals.sodium} unit="mg" />
            <MicroRow label="Potassium" current={nutrition.potassium} goal={4700} unit="mg" />
            <MicroRow label="Sugar" current={nutrition.sugar} goal={goals.sugar} unit="g" />
            <MicroRow label="Cholesterol" current={nutrition.cholesterol} goal={300} unit="mg" />
            <MicroRow label="Vitamin A" current={nutrition.vitaminA} goal={100} unit="%" />
            <MicroRow label="Vitamin C" current={nutrition.vitaminC} goal={100} unit="%" />
            <MicroRow label="Calcium" current={nutrition.calcium} goal={100} unit="%" />
            <MicroRow label="Iron" current={nutrition.iron} goal={100} unit="%" />
          </div>
        </div>

        {/* Calorie percent pill */}
        {caloriePct >= 90 && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${caloriePct >= 100 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
            <Award className={`w-5 h-5 flex-shrink-0 ${caloriePct >= 100 ? 'text-red-500' : 'text-amber-500'}`} />
            <p className={`text-sm font-medium ${caloriePct >= 100 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {caloriePct >= 100
                ? `You've exceeded your calorie goal by ${nutrition.calories - goals.calories} kcal today.`
                : `You're at ${caloriePct}% of your calorie goal. ${goals.calories - nutrition.calories} kcal remaining.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const mealEmojis: Record<string, string> = {
  Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎'
}
const mealColors: Record<string, string> = {
  Breakfast: 'bg-orange-100 dark:bg-orange-900/30',
  Lunch: 'bg-yellow-100 dark:bg-yellow-900/30',
  Dinner: 'bg-blue-100 dark:bg-blue-900/30',
  Snacks: 'bg-green-100 dark:bg-green-900/30',
}

const StatBox: React.FC<{ label: string; value: number; unit: string; color: string }> = ({ label, value, unit, color }) => (
  <div className="text-center">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className={`font-bold text-base ${color}`}>{value}</p>
    <p className="text-xs text-gray-400">{unit}</p>
  </div>
)

const MicroRow: React.FC<{ label: string; current: number; goal: number; unit: string }> = ({ label, current, goal, unit }) => {
  const pct = Math.min((current / Math.max(goal, 1)) * 100, 100)
  const isOver = current > goal
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={isOver ? 'text-red-500 font-medium' : 'text-gray-700 dark:text-gray-200'}>
          {current >= 10 ? Math.round(current) : current.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isOver ? 'bg-red-400' : 'bg-primary-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
