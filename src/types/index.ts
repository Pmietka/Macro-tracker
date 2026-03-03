export interface Food {
  id: string
  name: string
  brand?: string
  category: FoodCategory
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  potassium: number
  cholesterol: number
  saturatedFat: number
  transFat: number
  vitaminA: number    // % DV
  vitaminC: number    // % DV
  calcium: number     // % DV
  iron: number        // % DV
  isCustom?: boolean
  barcode?: string
}

export type FoodCategory =
  | 'Fruits'
  | 'Vegetables'
  | 'Grains & Cereals'
  | 'Dairy'
  | 'Meat & Poultry'
  | 'Fish & Seafood'
  | 'Legumes'
  | 'Nuts & Seeds'
  | 'Beverages'
  | 'Snacks'
  | 'Fast Food'
  | 'Condiments'
  | 'Oils & Fats'
  | 'Sweets & Desserts'
  | 'Custom'

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Pre-Workout' | 'Post-Workout'

export interface FoodEntry {
  id: string
  foodId: string
  food: Food
  servings: number
  mealType: MealType
  timestamp: number
}

export interface DiaryDay {
  date: string   // 'YYYY-MM-DD'
  entries: FoodEntry[]
  waterIntake: number  // ml
  exercises: ExerciseEntry[]
  notes?: string
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  metValue: number   // MET for calorie calculation
}

export type ExerciseCategory =
  | 'Cardio'
  | 'Strength'
  | 'Flexibility'
  | 'Sports'
  | 'Other'

export interface ExerciseEntry {
  id: string
  exerciseId: string
  exercise: Exercise
  durationMinutes: number
  caloriesBurned: number
  notes?: string
}

export interface WeightEntry {
  id: string
  date: string   // 'YYYY-MM-DD'
  weight: number  // in user's preferred unit
  bodyFat?: number  // %
  notes?: string
}

export interface UserProfile {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  heightCm: number
  activityLevel: ActivityLevel
  weightUnit: 'lbs' | 'kg'
  heightUnit: 'cm' | 'ft'
  goal: WeightGoal
  avatar?: string
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active'

export type WeightGoal = 'lose' | 'maintain' | 'gain'

export interface MacroGoals {
  calories: number
  protein: number    // grams
  carbs: number      // grams
  fat: number        // grams
  fiber: number      // grams
  sugar: number      // grams
  sodium: number     // mg
  water: number      // ml
  proteinPct: number   // %
  carbsPct: number     // %
  fatPct: number       // %
}

export interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  potassium: number
  cholesterol: number
  saturatedFat: number
  vitaminA: number
  vitaminC: number
  calcium: number
  iron: number
  caloriesBurned: number
  netCalories: number
}

export interface MealTemplate {
  id: string
  name: string
  entries: Omit<FoodEntry, 'id' | 'timestamp'>[]
  createdAt: number
}

export interface DailyStreak {
  current: number
  longest: number
  lastLoggedDate: string
}
