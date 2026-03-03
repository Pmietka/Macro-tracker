import React, { useState } from 'react'
import { Save, RefreshCw, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Navbar } from '../components/Layout/Navbar'
import { calculateBMR, calculateTDEE, calculateCalorieGoal, lbsToKg } from '../utils/calculations'

type Tab = 'calories' | 'macros' | 'other'

export const Goals: React.FC = () => {
  const goals = useStore(s => s.goals)
  const profile = useStore(s => s.profile)
  const currentWeightKg = useStore(s => s.currentWeightKg)
  const updateGoals = useStore(s => s.updateGoals)
  const recalculateGoals = useStore(s => s.recalculateGoals)

  const [activeTab, setActiveTab] = useState<Tab>('calories')
  const [local, setLocal] = useState({ ...goals })
  const [saved, setSaved] = useState(false)

  const bmr = calculateBMR(profile, currentWeightKg)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const suggestedCalories = calculateCalorieGoal(tdee, profile.goal)

  const totalPct = local.proteinPct + local.carbsPct + local.fatPct

  const handleSave = () => {
    updateGoals(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleRecalculate = () => {
    recalculateGoals()
    setLocal({ ...goals })
  }

  const updateMacroPct = (macro: 'proteinPct' | 'carbsPct' | 'fatPct', value: number) => {
    const next = { ...local, [macro]: value }
    // Auto-calculate grams from calories
    next.protein = Math.round((next.calories * next.proteinPct) / 400)
    next.carbs = Math.round((next.calories * next.carbsPct) / 400)
    next.fat = Math.round((next.calories * next.fatPct) / 900)
    setLocal(next)
  }

  const updateCalories = (calories: number) => {
    const next = {
      ...local,
      calories,
      protein: Math.round((calories * local.proteinPct) / 400),
      carbs: Math.round((calories * local.carbsPct) / 400),
      fat: Math.round((calories * local.fatPct) / 900),
    }
    setLocal(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title="Goals & Targets" />

      <div className="page-container space-y-4">

        {/* TDEE info card */}
        <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary-700 dark:text-primary-300 text-sm">Your Energy Needs</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400">BMR</p>
                  <p className="font-bold text-primary-700 dark:text-primary-300">{Math.round(bmr)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400">TDEE</p>
                  <p className="font-bold text-primary-700 dark:text-primary-300">{tdee}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400">Suggested</p>
                  <p className="font-bold text-primary-700 dark:text-primary-300">{suggestedCalories}</p>
                </div>
              </div>
              <button
                onClick={handleRecalculate}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Recalculate from profile
              </button>
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm">
          {(['calories', 'macros', 'other'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Calories tab */}
        {activeTab === 'calories' && (
          <div className="space-y-4">
            <div className="card p-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Daily Calorie Goal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1000}
                  max={5000}
                  step={50}
                  value={local.calories}
                  onChange={e => updateCalories(Number(e.target.value))}
                  className="flex-1 accent-primary-500"
                />
                <input
                  type="number"
                  value={local.calories}
                  onChange={e => updateCalories(Number(e.target.value))}
                  className="input-field w-24 text-center font-bold"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1000</span><span>kcal</span><span>5000</span>
              </div>
            </div>

            {/* Goal presets */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Quick Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Cut (-500)', cal: tdee - 500, color: 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
                  { label: 'Maintain', cal: tdee, color: 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' },
                  { label: 'Bulk (+300)', cal: tdee + 300, color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => updateCalories(Math.max(1000, preset.cal))}
                    className={`border rounded-xl p-2 text-center text-xs font-medium transition-colors ${preset.color}`}
                  >
                    <div className="font-bold text-base">{Math.max(1000, preset.cal)}</div>
                    <div>{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Macros tab */}
        {activeTab === 'macros' && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Macro Split</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalPct === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {totalPct}% total
                </span>
              </div>

              {/* Visual macro bar */}
              <div className="flex h-4 rounded-full overflow-hidden mb-4">
                <div className="bg-blue-500 transition-all" style={{ width: `${local.proteinPct}%` }} />
                <div className="bg-amber-500 transition-all" style={{ width: `${local.carbsPct}%` }} />
                <div className="bg-red-400 transition-all" style={{ width: `${local.fatPct}%` }} />
              </div>

              {[
                { key: 'proteinPct' as const, label: 'Protein', color: 'accent-blue-500', bg: 'bg-blue-500', gram: local.protein },
                { key: 'carbsPct' as const, label: 'Carbs', color: 'accent-amber-500', bg: 'bg-amber-500', gram: local.carbs },
                { key: 'fatPct' as const, label: 'Fat', color: 'accent-red-400', bg: 'bg-red-400', gram: local.fat },
              ].map(({ key, label, color, gram }) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{gram}g</span>
                      <input
                        type="number"
                        value={local[key]}
                        onChange={e => updateMacroPct(key, Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="input-field w-16 text-center text-sm py-1"
                        min={0} max={100}
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={70}
                    value={local[key]}
                    onChange={e => updateMacroPct(key, Number(e.target.value))}
                    className={`w-full ${color}`}
                  />
                </div>
              ))}

              {/* Preset splits */}
              <div className="border-t dark:border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">Common splits:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Balanced', p: 30, c: 40, f: 30 },
                    { label: 'Low Carb', p: 35, c: 25, f: 40 },
                    { label: 'High Protein', p: 40, c: 35, f: 25 },
                    { label: 'Keto', p: 25, c: 5, f: 70 },
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => {
                        const next = { ...local, proteinPct: s.p, carbsPct: s.c, fatPct: s.f }
                        next.protein = Math.round((next.calories * s.p) / 400)
                        next.carbs = Math.round((next.calories * s.c) / 400)
                        next.fat = Math.round((next.calories * s.f) / 900)
                        setLocal(next)
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {s.label} ({s.p}/{s.c}/{s.f})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual gram targets */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Manual Gram Targets</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'protein' as const, label: 'Protein (g)' },
                  { key: 'carbs' as const, label: 'Carbs (g)' },
                  { key: 'fat' as const, label: 'Fat (g)' },
                  { key: 'fiber' as const, label: 'Fiber (g)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <input
                      type="number"
                      value={local[key]}
                      onChange={e => setLocal(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="input-field text-center"
                      min={0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tab */}
        {activeTab === 'other' && (
          <div className="space-y-4">
            <div className="card p-4 space-y-4">
              <NumberGoalRow
                label="Water Goal (ml)"
                value={local.water}
                onChange={v => setLocal(p => ({ ...p, water: v }))}
                min={500}
                max={6000}
                step={100}
              />
              <NumberGoalRow
                label="Sodium Limit (mg)"
                value={local.sodium}
                onChange={v => setLocal(p => ({ ...p, sodium: v }))}
                min={500}
                max={5000}
                step={100}
              />
              <NumberGoalRow
                label="Sugar Limit (g)"
                value={local.sugar}
                onChange={v => setLocal(p => ({ ...p, sugar: v }))}
                min={10}
                max={150}
                step={5}
              />
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`btn-primary w-full flex items-center justify-center gap-2 py-3 ${saved ? 'bg-green-500' : ''}`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Goals'}
        </button>
      </div>
    </div>
  )
}

const NumberGoalRow: React.FC<{
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number
}> = ({ label, value, onChange, min, max, step }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="input-field w-24 text-center text-sm py-1"
        min={min} max={max} step={step}
      />
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-primary-500"
    />
    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
)
