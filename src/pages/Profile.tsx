import React, { useState } from 'react'
import { Scale, Plus, Trash2, ChevronRight, Award, Flame, Activity, User, LogOut } from 'lucide-react'
import { googleLogout } from '@react-oauth/google'
import { useStore } from '../store/useStore'
import { Navbar } from '../components/Layout/Navbar'
import { calculateBMI, getBMICategory, kgToLbs, lbsToKg, cmToFeetInches, getTodayString } from '../utils/calculations'
import { ActivityLevel, WeightGoal, UserProfile } from '../types'
import { FOOD_DATABASE } from '../data/foodDatabase'

type Tab = 'profile' | 'weight' | 'custom' | 'templates'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (desk job)',
  lightly_active: 'Lightly Active (1-3x/week)',
  moderately_active: 'Moderately Active (3-5x/week)',
  very_active: 'Very Active (6-7x/week)',
  extra_active: 'Extra Active (2x/day)',
}

export const Profile: React.FC = () => {
  const profile = useStore(s => s.profile)
  const googleUser = useStore(s => s.googleUser)
  const setGoogleUser = useStore(s => s.setGoogleUser)
  const currentWeightKg = useStore(s => s.currentWeightKg)
  const weightLog = useStore(s => s.weightLog)
  const streak = useStore(s => s.streak)
  const customFoods = useStore(s => s.customFoods)
  const mealTemplates = useStore(s => s.mealTemplates)
  const updateProfile = useStore(s => s.updateProfile)
  const setCurrentWeight = useStore(s => s.setCurrentWeight)
  const addWeightEntry = useStore(s => s.addWeightEntry)
  const removeWeightEntry = useStore(s => s.removeWeightEntry)
  const removeCustomFood = useStore(s => s.removeCustomFood)
  const deleteMealTemplate = useStore(s => s.deleteMealTemplate)
  const addCustomFood = useStore(s => s.addCustomFood)
  const recalculateGoals = useStore(s => s.recalculateGoals)

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [newWeight, setNewWeight] = useState('')
  const [newBodyFat, setNewBodyFat] = useState('')
  const [saved, setSaved] = useState(false)
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false)

  const displayWeight = profile.weightUnit === 'lbs' ? kgToLbs(currentWeightKg) : currentWeightKg
  const bmi = calculateBMI(currentWeightKg, profile.heightCm)
  const bmiCat = getBMICategory(bmi)

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    updateProfile(updates)
    recalculateGoals()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogWeight = () => {
    const w = parseFloat(newWeight)
    if (!w) return
    addWeightEntry({
      date: getTodayString(),
      weight: w,
      bodyFat: newBodyFat ? parseFloat(newBodyFat) : undefined,
    })
    setNewWeight('')
    setNewBodyFat('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title="Profile" />

      <div className="page-container space-y-4">

        {/* Profile summary card */}
        <div className="card p-4">
          <div className="flex items-center gap-4">
            {googleUser?.picture ? (
              <img src={googleUser.picture} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-2xl">
                <User className="w-8 h-8 text-primary-500" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name || 'Your Name'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {googleUser?.email && <span className="block text-xs">{googleUser.email}</span>}
                {profile.age}y · {profile.gender} · {
                  profile.heightUnit === 'cm'
                    ? `${profile.heightCm}cm`
                    : cmToFeetInches(profile.heightCm)
                }
              </p>
            </div>
            <button
              onClick={() => { googleLogout(); setGoogleUser(null) }}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{displayWeight}</p>
              <p className="text-xs text-gray-500">{profile.weightUnit}</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <p className={`text-lg font-bold ${bmiCat.color}`}>{bmi}</p>
              <p className="text-xs text-gray-500">BMI</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{streak.current}</p>
              </div>
              <p className="text-xs text-gray-500">Day Streak</p>
            </div>
          </div>
          <p className={`text-center text-xs mt-2 font-medium ${bmiCat.color}`}>{bmiCat.label}</p>
        </div>

        {/* Achievements */}
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> Achievements
          </h3>
          <div className="flex gap-2 flex-wrap">
            {streak.current >= 7 && <Badge label={`${streak.current} Day Streak`} emoji="🔥" />}
            {streak.longest >= 30 && <Badge label="30 Day Warrior" emoji="⚔️" />}
            {weightLog.length >= 10 && <Badge label="Scale Tracker" emoji="⚖️" />}
            {weightLog.length === 0 && streak.current === 0 && (
              <p className="text-xs text-gray-400">Log your first meal to earn achievements!</p>
            )}
            {streak.current > 0 && <Badge label="First Log" emoji="🌱" />}
            {streak.current >= 3 && <Badge label="3 Day Streak" emoji="🔥" />}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-sm overflow-x-auto">
          {(['profile', 'weight', 'custom', 'templates'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="card p-4 space-y-4">
            <FormField label="Name">
              <input
                type="text"
                defaultValue={profile.name}
                onBlur={e => handleSaveProfile({ name: e.target.value })}
                className="input-field"
                placeholder="Your name"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Age">
                <input
                  type="number"
                  defaultValue={profile.age}
                  onBlur={e => handleSaveProfile({ age: Number(e.target.value) })}
                  className="input-field"
                  min={13} max={100}
                />
              </FormField>

              <FormField label="Gender">
                <select
                  defaultValue={profile.gender}
                  onChange={e => handleSaveProfile({ gender: e.target.value as UserProfile['gender'] })}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label={`Height (${profile.heightUnit})`}>
                <input
                  type="number"
                  defaultValue={profile.heightCm}
                  onBlur={e => handleSaveProfile({ heightCm: Number(e.target.value) })}
                  className="input-field"
                  min={100} max={250}
                />
              </FormField>

              <FormField label="Units">
                <select
                  defaultValue={profile.weightUnit}
                  onChange={e => handleSaveProfile({ weightUnit: e.target.value as 'lbs' | 'kg' })}
                  className="input-field"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </FormField>
            </div>

            <FormField label="Activity Level">
              <select
                defaultValue={profile.activityLevel}
                onChange={e => handleSaveProfile({ activityLevel: e.target.value as ActivityLevel })}
                className="input-field"
              >
                {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Goal">
              <select
                defaultValue={profile.goal}
                onChange={e => handleSaveProfile({ goal: e.target.value as WeightGoal })}
                className="input-field"
              >
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Gain Weight</option>
              </select>
            </FormField>

            {saved && (
              <p className="text-center text-sm text-green-500 font-medium animate-fade-in">Saved!</p>
            )}
          </div>
        )}

        {/* Weight log tab */}
        {activeTab === 'weight' && (
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Log Weight</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={`Weight (${profile.weightUnit})`}
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  className="input-field flex-1"
                  step="0.1"
                />
                <input
                  type="number"
                  placeholder="Body Fat %"
                  value={newBodyFat}
                  onChange={e => setNewBodyFat(e.target.value)}
                  className="input-field w-28"
                  step="0.1" min="3" max="50"
                />
              </div>
              <button onClick={handleLogWeight} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Log Weight
              </button>
            </div>

            {/* Weight history */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Weight History</h3>
              </div>
              {weightLog.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No weight entries yet</p>
              ) : (
                weightLog.slice(0, 20).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {entry.weight} {profile.weightUnit}
                        {entry.bodyFat && <span className="text-gray-400 text-sm ml-2">· {entry.bodyFat}% body fat</span>}
                      </p>
                      <p className="text-xs text-gray-400">{entry.date}</p>
                    </div>
                    <button
                      onClick={() => removeWeightEntry(entry.id)}
                      className="btn-icon p-1.5 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Custom foods tab */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCustomFoodForm(!showCustomFoodForm)}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Custom Food
            </button>

            {showCustomFoodForm && (
              <CustomFoodForm
                onSave={(food) => { addCustomFood(food); setShowCustomFoodForm(false) }}
                onCancel={() => setShowCustomFoodForm(false)}
              />
            )}

            <div className="card overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Custom Foods ({customFoods.length})</h3>
              </div>
              {customFoods.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No custom foods yet</p>
              ) : (
                customFoods.map(food => (
                  <div key={food.id} className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{food.name}</p>
                      <p className="text-xs text-gray-400">
                        {food.calories} kcal · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g
                      </p>
                    </div>
                    <button onClick={() => removeCustomFood(food.id)} className="btn-icon p-1.5 text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Meal Templates ({mealTemplates.length})</h3>
              <p className="text-xs text-gray-400 mt-1">Save meals from Diary to reuse them</p>
            </div>
            {mealTemplates.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No templates saved yet</p>
            ) : (
              mealTemplates.map(template => (
                <div key={template.id} className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{template.name}</p>
                    <p className="text-xs text-gray-400">{template.entries.length} items</p>
                  </div>
                  <button onClick={() => deleteMealTemplate(template.id)} className="btn-icon p-1.5 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{label}</label>
    {children}
  </div>
)

const Badge: React.FC<{ label: string; emoji: string }> = ({ label, emoji }) => (
  <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full">
    <span>{emoji}</span>
    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{label}</span>
  </div>
)

const CustomFoodForm: React.FC<{ onSave: (food: any) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: '', servingSize: 100, servingUnit: 'g', calories: 0,
    protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0,
    sodium: 0, potassium: 0, cholesterol: 0, saturatedFat: 0, transFat: 0,
    vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0,
    category: 'Custom' as const,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    onSave(form)
  }

  const f = (key: string, label: string, type = 'number') => (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        className="input-field text-sm"
        step={type === 'number' ? '0.1' : undefined}
        required={key === 'name'}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">New Custom Food</h3>
      {f('name', 'Food Name *', 'text')}
      <div className="grid grid-cols-2 gap-3">
        {f('servingSize', 'Serving Size')}
        {f('servingUnit', 'Unit (g, ml, oz...)', 'text')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {f('calories', 'Calories (kcal)')}
        {f('protein', 'Protein (g)')}
        {f('carbs', 'Carbs (g)')}
        {f('fat', 'Fat (g)')}
        {f('fiber', 'Fiber (g)')}
        {f('sugar', 'Sugar (g)')}
        {f('sodium', 'Sodium (mg)')}
        {f('potassium', 'Potassium (mg)')}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1">Save Food</button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      </div>
    </form>
  )
}
