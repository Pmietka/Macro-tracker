import React from 'react'
import { Food } from '../types'

interface NutritionLabelProps {
  food: Food
  servings?: number
  onClose?: () => void
}

export const NutritionLabel: React.FC<NutritionLabelProps> = ({ food, servings = 1, onClose }) => {
  const mult = servings

  const row = (label: string, value: number | string, unit: string = '', indent = false, bold = false) => (
    <div className={`flex justify-between py-0.5 text-sm ${indent ? 'pl-4' : ''} ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{typeof value === 'number' ? (value * mult).toFixed(value < 1 ? 1 : 0) : value}{unit}</span>
    </div>
  )

  const dvRow = (label: string, value: number) => (
    <div className="flex justify-between py-0.5 text-sm pl-4">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold">{Math.round(value * mult)}%</span>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl w-full max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-950 p-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold leading-tight">{food.name}</h2>
            {food.brand && <p className="text-gray-400 text-sm">{food.brand}</p>}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none ml-2">×</button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-300">
          Serving size: {food.servingSize}{food.servingUnit}
          {servings !== 1 && <span className="text-primary-400"> × {servings}</span>}
        </div>
      </div>

      {/* Nutrition facts */}
      <div className="p-4 font-mono text-gray-900 dark:text-gray-100">
        <div className="border-b-8 border-gray-900 dark:border-gray-100 pb-2 mb-2">
          <p className="text-2xl font-extrabold">Nutrition Facts</p>
          <p className="text-sm">Serving size {food.servingSize}{food.servingUnit}{servings !== 1 ? ` (×${servings})` : ''}</p>
        </div>

        <div className="border-b-4 border-gray-900 dark:border-gray-100 pb-2 mb-1">
          <p className="text-xs">Amount Per Serving</p>
          <div className="flex justify-between items-baseline">
            <span className="text-xl font-extrabold">Calories</span>
            <span className="text-4xl font-extrabold">{Math.round(food.calories * mult)}</span>
          </div>
        </div>

        <div className="text-xs text-right mb-1 border-b border-gray-300 dark:border-gray-600 pb-1">
          % Daily Value*
        </div>

        <div className="space-y-0.5 divide-y divide-gray-200 dark:divide-gray-700">
          <div className="flex justify-between py-0.5">
            <span className="font-bold text-sm">Total Fat</span>
            <span className="text-sm font-bold">{(food.fat * mult).toFixed(1)}g</span>
          </div>
          {dvRow('Saturated Fat', food.saturatedFat)}
          {dvRow('Trans Fat', food.transFat)}

          <div className="flex justify-between py-0.5">
            <span className="font-bold text-sm">Cholesterol</span>
            <span className="text-sm">{Math.round(food.cholesterol * mult)}mg</span>
          </div>

          <div className="flex justify-between py-0.5">
            <span className="font-bold text-sm">Sodium</span>
            <span className="text-sm">{Math.round(food.sodium * mult)}mg</span>
          </div>
          <div className="flex justify-between py-0.5 pl-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Potassium</span>
            <span className="text-sm">{Math.round(food.potassium * mult)}mg</span>
          </div>

          <div className="flex justify-between py-0.5">
            <span className="font-bold text-sm">Total Carbohydrate</span>
            <span className="text-sm font-bold">{(food.carbs * mult).toFixed(1)}g</span>
          </div>
          <div className="flex justify-between py-0.5 pl-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Dietary Fiber</span>
            <span className="text-sm">{(food.fiber * mult).toFixed(1)}g</span>
          </div>
          <div className="flex justify-between py-0.5 pl-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Sugars</span>
            <span className="text-sm">{(food.sugar * mult).toFixed(1)}g</span>
          </div>

          <div className="flex justify-between py-0.5">
            <span className="font-bold text-sm">Protein</span>
            <span className="text-sm font-bold">{(food.protein * mult).toFixed(1)}g</span>
          </div>
        </div>

        {/* Micronutrients */}
        <div className="border-t-4 border-gray-900 dark:border-gray-100 mt-2 pt-2 grid grid-cols-2 gap-x-4 text-xs">
          <div className="flex justify-between"><span>Vitamin A</span><span>{Math.round(food.vitaminA * mult)}%</span></div>
          <div className="flex justify-between"><span>Vitamin C</span><span>{Math.round(food.vitaminC * mult)}%</span></div>
          <div className="flex justify-between"><span>Calcium</span><span>{Math.round(food.calcium * mult)}%</span></div>
          <div className="flex justify-between"><span>Iron</span><span>{Math.round(food.iron * mult)}%</span></div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          * % Daily Values are based on a 2,000 calorie diet.
        </p>
      </div>

      {/* Macro summary bar */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-bold text-blue-500">{(food.protein * mult).toFixed(1)}g</div>
            <div className="text-xs text-gray-500">Protein</div>
          </div>
          <div>
            <div className="font-bold text-amber-500">{(food.carbs * mult).toFixed(1)}g</div>
            <div className="text-xs text-gray-500">Carbs</div>
          </div>
          <div>
            <div className="font-bold text-red-400">{(food.fat * mult).toFixed(1)}g</div>
            <div className="text-xs text-gray-500">Fat</div>
          </div>
        </div>
      </div>
    </div>
  )
}
