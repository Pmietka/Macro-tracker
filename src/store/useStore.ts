import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuidv4 } from 'uuid'
import {
  DiaryDay, FoodEntry, Food, MealType, ExerciseEntry, Exercise,
  WeightEntry, UserProfile, MacroGoals, MealTemplate, DailyStreak,
} from '../types'
import { getTodayString, calculateBMR, calculateTDEE, calculateCalorieGoal, calculateMacroGoals, lbsToKg } from '../utils/calculations'

export interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string  // Google user ID
}

interface AppState {
  // Auth
  googleUser: GoogleUser | null
  setGoogleUser: (user: GoogleUser | null) => void

  // User
  profile: UserProfile
  currentWeightKg: number

  // Goals
  goals: MacroGoals

  // Diary
  diary: Record<string, DiaryDay>  // date -> DiaryDay

  // Weight log
  weightLog: WeightEntry[]

  // Meal templates
  mealTemplates: MealTemplate[]

  // Custom foods
  customFoods: Food[]

  // Recent foods (ids)
  recentFoodIds: string[]

  // Streak
  streak: DailyStreak

  // Theme
  darkMode: boolean

  // Actions
  updateProfile: (profile: Partial<UserProfile>) => void
  setCurrentWeight: (weight: number) => void
  updateGoals: (goals: Partial<MacroGoals>) => void
  recalculateGoals: () => void

  addFoodEntry: (date: string, entry: Omit<FoodEntry, 'id' | 'timestamp'>) => void
  removeFoodEntry: (date: string, entryId: string) => void
  updateFoodEntry: (date: string, entryId: string, servings: number) => void
  copyDayEntries: (fromDate: string, toDate: string) => void

  addExerciseEntry: (date: string, exercise: Exercise, durationMinutes: number, weightKg: number) => void
  removeExerciseEntry: (date: string, entryId: string) => void

  setWaterIntake: (date: string, ml: number) => void
  addWater: (date: string, ml: number) => void

  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => void
  removeWeightEntry: (id: string) => void

  addCustomFood: (food: Omit<Food, 'id' | 'isCustom'>) => Food
  removeCustomFood: (id: string) => void

  saveMealTemplate: (name: string, date: string, mealType?: MealType) => void
  deleteMealTemplate: (id: string) => void
  applyMealTemplate: (templateId: string, date: string) => void

  addRecentFood: (foodId: string) => void
  updateStreak: () => void
  toggleDarkMode: () => void

  getDayOrCreate: (date: string) => DiaryDay
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  age: 30,
  gender: 'male',
  heightCm: 175,
  activityLevel: 'moderately_active',
  weightUnit: 'lbs',
  heightUnit: 'cm',
  goal: 'maintain',
}

const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 67,
  fiber: 30,
  sugar: 50,
  sodium: 2300,
  water: 2500,
  proteinPct: 30,
  carbsPct: 40,
  fatPct: 30,
}

export const useStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      googleUser: null,
      setGoogleUser: (user) => set((state) => { state.googleUser = user }),

      profile: DEFAULT_PROFILE,
      currentWeightKg: 75,
      goals: DEFAULT_GOALS,
      diary: {},
      weightLog: [],
      mealTemplates: [],
      customFoods: [],
      recentFoodIds: [],
      darkMode: false,
      streak: { current: 0, longest: 0, lastLoggedDate: '' },

      getDayOrCreate: (date: string): DiaryDay => {
        const existing = get().diary[date]
        if (existing) return existing
        return { date, entries: [], waterIntake: 0, exercises: [] }
      },

      updateProfile: (updates) => set((state) => {
        Object.assign(state.profile, updates)
      }),

      setCurrentWeight: (weight) => set((state) => {
        state.currentWeightKg = weight
      }),

      updateGoals: (updates) => set((state) => {
        Object.assign(state.goals, updates)
      }),

      recalculateGoals: () => set((state) => {
        const { profile, currentWeightKg } = state
        const bmr = calculateBMR(profile, currentWeightKg)
        const tdee = calculateTDEE(bmr, profile.activityLevel)
        const calories = calculateCalorieGoal(tdee, profile.goal)
        const macros = calculateMacroGoals(
          calories,
          state.goals.proteinPct,
          state.goals.carbsPct,
          state.goals.fatPct,
          currentWeightKg
        )
        Object.assign(state.goals, macros)
      }),

      addFoodEntry: (date, entryData) => set((state) => {
        if (!state.diary[date]) {
          state.diary[date] = { date, entries: [], waterIntake: 0, exercises: [] }
        }
        const entry: FoodEntry = {
          ...entryData,
          id: uuidv4(),
          timestamp: Date.now(),
        }
        state.diary[date].entries.push(entry)

        // Update recent foods
        const { id } = entryData.food
        state.recentFoodIds = [id, ...state.recentFoodIds.filter(fid => fid !== id)].slice(0, 20)
      }),

      removeFoodEntry: (date, entryId) => set((state) => {
        if (state.diary[date]) {
          state.diary[date].entries = state.diary[date].entries.filter(e => e.id !== entryId)
        }
      }),

      updateFoodEntry: (date, entryId, servings) => set((state) => {
        if (state.diary[date]) {
          const entry = state.diary[date].entries.find(e => e.id === entryId)
          if (entry) entry.servings = servings
        }
      }),

      copyDayEntries: (fromDate, toDate) => set((state) => {
        const fromDay = state.diary[fromDate]
        if (!fromDay) return
        if (!state.diary[toDate]) {
          state.diary[toDate] = { date: toDate, entries: [], waterIntake: 0, exercises: [] }
        }
        const newEntries = fromDay.entries.map(e => ({
          ...e,
          id: uuidv4(),
          timestamp: Date.now(),
        }))
        state.diary[toDate].entries.push(...newEntries)
      }),

      addExerciseEntry: (date, exercise, durationMinutes, weightKg) => set((state) => {
        if (!state.diary[date]) {
          state.diary[date] = { date, entries: [], waterIntake: 0, exercises: [] }
        }
        const caloriesBurned = Math.round((exercise.metValue * weightKg * durationMinutes) / 60)
        const entry: ExerciseEntry = {
          id: uuidv4(),
          exerciseId: exercise.id,
          exercise,
          durationMinutes,
          caloriesBurned,
        }
        state.diary[date].exercises.push(entry)
      }),

      removeExerciseEntry: (date, entryId) => set((state) => {
        if (state.diary[date]) {
          state.diary[date].exercises = state.diary[date].exercises.filter(e => e.id !== entryId)
        }
      }),

      setWaterIntake: (date, ml) => set((state) => {
        if (!state.diary[date]) {
          state.diary[date] = { date, entries: [], waterIntake: 0, exercises: [] }
        }
        state.diary[date].waterIntake = Math.max(0, ml)
      }),

      addWater: (date, ml) => set((state) => {
        if (!state.diary[date]) {
          state.diary[date] = { date, entries: [], waterIntake: 0, exercises: [] }
        }
        state.diary[date].waterIntake = Math.max(0, (state.diary[date].waterIntake || 0) + ml)
      }),

      addWeightEntry: (entryData) => set((state) => {
        const entry: WeightEntry = { ...entryData, id: uuidv4() }
        state.weightLog = [entry, ...state.weightLog.filter(w => w.date !== entryData.date)]
        state.weightLog.sort((a, b) => b.date.localeCompare(a.date))
        // Update current weight
        if (state.weightLog.length > 0) {
          const latestKg = state.profile.weightUnit === 'lbs'
            ? entryData.weight / 2.20462
            : entryData.weight
          state.currentWeightKg = latestKg
        }
      }),

      removeWeightEntry: (id) => set((state) => {
        state.weightLog = state.weightLog.filter(w => w.id !== id)
      }),

      addCustomFood: (foodData) => {
        const food: Food = { ...foodData, id: `custom_${uuidv4()}`, isCustom: true }
        set((state) => { state.customFoods.push(food) })
        return food
      },

      removeCustomFood: (id) => set((state) => {
        state.customFoods = state.customFoods.filter(f => f.id !== id)
      }),

      saveMealTemplate: (name, date, mealType) => set((state) => {
        const day = state.diary[date]
        if (!day) return
        const entries = mealType
          ? day.entries.filter(e => e.mealType === mealType)
          : day.entries
        const template: MealTemplate = {
          id: uuidv4(),
          name,
          entries: entries.map(({ id: _id, timestamp: _ts, ...rest }) => rest),
          createdAt: Date.now(),
        }
        state.mealTemplates.push(template)
      }),

      deleteMealTemplate: (id) => set((state) => {
        state.mealTemplates = state.mealTemplates.filter(t => t.id !== id)
      }),

      applyMealTemplate: (templateId, date) => set((state) => {
        const template = state.mealTemplates.find(t => t.id === templateId)
        if (!template) return
        if (!state.diary[date]) {
          state.diary[date] = { date, entries: [], waterIntake: 0, exercises: [] }
        }
        const newEntries = template.entries.map(e => ({
          ...e,
          id: uuidv4(),
          timestamp: Date.now(),
        }))
        state.diary[date].entries.push(...newEntries)
      }),

      addRecentFood: (foodId) => set((state) => {
        state.recentFoodIds = [foodId, ...state.recentFoodIds.filter(id => id !== foodId)].slice(0, 20)
      }),

      updateStreak: () => set((state) => {
        const today = getTodayString()
        if (state.streak.lastLoggedDate === today) return

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const newCurrent = state.streak.lastLoggedDate === yesterdayStr
          ? state.streak.current + 1
          : 1

        state.streak = {
          current: newCurrent,
          longest: Math.max(state.streak.longest, newCurrent),
          lastLoggedDate: today,
        }
      }),

      toggleDarkMode: () => set((state) => {
        state.darkMode = !state.darkMode
      }),
    })),
    {
      name: 'macrofit-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
