import React, { useState, useRef, useEffect } from 'react'
import { Scale, Plus, Trash2, Award, Flame, User, Ruler, Image, LogOut, Loader2, Download, Smartphone, CheckCircle } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
import { v4 as uuidv4 } from 'uuid'
import { useStore } from '../store/useStore'
import { useAuth } from '../contexts/AuthContext'
import { uploadProgressPhoto, deleteProgressPhoto } from '../lib/storage'
import { Navbar } from '../components/Layout/Navbar'
import { calculateBMI, getBMICategory, kgToLbs, cmToFeetInches, getTodayString } from '../utils/calculations'
import { ActivityLevel, WeightGoal, UserProfile, PhotoPose } from '../types'

type Tab = 'profile' | 'weight' | 'body' | 'photos' | 'custom' | 'templates'

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (desk job)',
  lightly_active: 'Lightly Active (1-3x/week)',
  moderately_active: 'Moderately Active (3-5x/week)',
  very_active: 'Very Active (6-7x/week)',
  extra_active: 'Extra Active (2x/day)',
}

export const Profile: React.FC = () => {
  const profile = useStore(s => s.profile)
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
  const bodyMeasurements = useStore(s => s.bodyMeasurements)
  const addBodyMeasurement = useStore(s => s.addBodyMeasurement)
  const removeBodyMeasurement = useStore(s => s.removeBodyMeasurement)
  const progressPhotos = useStore(s => s.progressPhotos)
  const addProgressPhoto = useStore(s => s.addProgressPhoto)
  const removeProgressPhoto = useStore(s => s.removeProgressPhoto)

  const { user, signOut } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('profile')

  // PWA install state
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaInstalled, setPwaInstalled] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches
  )
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallEvent(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setPwaInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  const [newWeight, setNewWeight] = useState('')
  const [newBodyFat, setNewBodyFat] = useState('')
  const [saved, setSaved] = useState(false)
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false)
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoNote, setPhotoNote] = useState('')
  const [photoPose, setPhotoPose] = useState<PhotoPose>('front')

  const compressImage = (file: File): Promise<string> =>
    new Promise(resolve => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const max = 800
        const scale = Math.min(max / img.width, max / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', 0.65))
      }
      img.src = url
    })

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
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-2xl">
              <User className="w-8 h-8 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name || 'Your Name'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile.age}y · {profile.gender} · {
                  profile.heightUnit === 'cm'
                    ? `${profile.heightCm}cm`
                    : cmToFeetInches(profile.heightCm)
                }
              </p>
              {user?.email && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{user.email}</p>
              )}
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
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
          {(['profile', 'weight', 'body', 'photos', 'custom', 'templates'] as Tab[]).map(tab => (
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

        {/* App / Install section — shown on profile tab */}
        {activeTab === 'profile' && (
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary-500" /> Get the App
            </h3>
            {pwaInstalled ? (
              <div className="flex items-center gap-3 py-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">MacroFit is installed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Running as a native app on this device</p>
                </div>
              </div>
            ) : installEvent ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Install MacroFit on your home screen for fast, offline access — no app store needed.
                </p>
                <button
                  onClick={async () => {
                    await installEvent.prompt()
                    const { outcome } = await installEvent.userChoice
                    if (outcome === 'accepted') { setPwaInstalled(true); setInstallEvent(null) }
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Install on this device
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add MacroFit to your home screen for quick access.
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>Chrome / Android:</strong> tap the ⋮ menu → "Add to Home screen"</li>
                  <li><strong>Safari / iOS:</strong> tap the share icon → "Add to Home Screen"</li>
                  <li><strong>Edge / Desktop:</strong> click the install icon in the address bar</li>
                </ul>
              </div>
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

        {/* Body measurements tab */}
        {activeTab === 'body' && (
          <div className="space-y-4">
            <BodyMeasurementForm onSave={m => addBodyMeasurement({ ...m, date: getTodayString() })} />
            <div className="card overflow-hidden">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-500" /> Measurement History
                </h3>
              </div>
              {bodyMeasurements.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No measurements logged yet</p>
              ) : (
                bodyMeasurements.slice(0, 20).map(m => (
                  <div key={m.id} className="px-4 py-3 border-b dark:border-gray-700 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{m.date}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                          {m.waist    && <span>Waist <b>{m.waist}</b></span>}
                          {m.chest    && <span>Chest <b>{m.chest}</b></span>}
                          {m.hips     && <span>Hips <b>{m.hips}</b></span>}
                          {m.leftArm  && <span>Arm <b>{m.leftArm}</b></span>}
                          {m.neck     && <span>Neck <b>{m.neck}</b></span>}
                        </div>
                      </div>
                      <button onClick={() => removeBodyMeasurement(m.id)} className="btn-icon p-1.5 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Progress photos tab */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-500" /> Add Progress Photo
              </h3>
              <div className="flex gap-2">
                {(['front', 'side', 'back'] as PhotoPose[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPhotoPose(p)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${photoPose === p ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >{p}</button>
                ))}
              </div>
              <input
                value={photoNote}
                onChange={e => setPhotoNote(e.target.value)}
                placeholder="Optional note..."
                className="input-field text-sm"
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setPhotoUploading(true)
                  try {
                    const photoId = uuidv4()
                    const dataUrl = await compressImage(file)
                    // Try Supabase Storage first; fall back to base64 if not configured
                    const storageUrl = user
                      ? await uploadProgressPhoto(user.id, photoId, dataUrl)
                      : null
                    addProgressPhoto({
                      id: photoId,
                      date: getTodayString(),
                      dataUrl: storageUrl ?? dataUrl,
                      pose: photoPose,
                      notes: photoNote || undefined,
                    })
                    setPhotoNote('')
                  } finally {
                    setPhotoUploading(false)
                    e.target.value = ''
                  }
                }}
              />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {photoUploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Plus className="w-4 h-4" /> Take / Upload Photo</>
                }
              </button>
              {progressPhotos.length >= 18 && (
                <p className="text-xs text-amber-500 text-center">Near the 20-photo limit. Remove old photos to add more.</p>
              )}
            </div>

            {/* Photo grid */}
            {progressPhotos.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No photos yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {progressPhotos.map(p => (
                  <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={p.dataUrl}
                      alt={p.pose}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setViewPhoto(p.dataUrl)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 flex justify-between items-center">
                      <span className="text-white text-xs capitalize">{p.pose}</span>
                      <button onClick={() => {
                        removeProgressPhoto(p.id)
                        if (user) deleteProgressPhoto(user.id, p.id)
                      }} className="text-red-300 hover:text-red-200">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 bg-black/40 text-white text-xs px-1 rounded">{p.date}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Full-screen photo viewer */}
            {viewPhoto && (
              <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setViewPhoto(null)}>
                <img src={viewPhoto} alt="progress" className="max-w-full max-h-full object-contain" />
              </div>
            )}
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

const BodyMeasurementForm: React.FC<{ onSave: (m: Record<string, number | undefined>) => void }> = ({ onSave }) => {
  const [form, setForm] = useState<Record<string, string>>({})
  const fields: [string, string][] = [
    ['neck', 'Neck'], ['shoulders', 'Shoulders'], ['chest', 'Chest'], ['waist', 'Waist'],
    ['hips', 'Hips'], ['leftArm', 'Arm (L)'], ['rightArm', 'Arm (R)'], ['leftThigh', 'Thigh'],
  ]
  const n = (v: string) => v ? parseFloat(v) : undefined
  const handleSave = () => {
    const data = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, n(v)]))
    if (Object.values(data).every(v => v === undefined)) return
    onSave(data)
    setForm({})
  }
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Ruler className="w-4 h-4 text-blue-500" /> Log Measurements (cm)
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
            <input
              type="number" step="0.1" min="0"
              value={form[key] ?? ''}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              className="input-field text-sm py-1.5"
              placeholder="—"
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Save Measurements
      </button>
    </div>
  )
}

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
