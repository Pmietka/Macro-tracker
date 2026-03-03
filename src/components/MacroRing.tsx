import React from 'react'

interface MacroRingProps {
  calories: number
  goal: number
  protein: number
  carbs: number
  fat: number
  size?: number
}

export const MacroRing: React.FC<MacroRingProps> = ({
  calories, goal, protein, carbs, fat, size = 180
}) => {
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const totalMacroCalories = protein * 4 + carbs * 4 + fat * 9
  const proteinPct = totalMacroCalories > 0 ? (protein * 4) / totalMacroCalories : 0
  const carbsPct = totalMacroCalories > 0 ? (carbs * 4) / totalMacroCalories : 0
  const fatPct = totalMacroCalories > 0 ? (fat * 9) / totalMacroCalories : 0

  const caloriePct = Math.min(calories / Math.max(goal, 1), 1)
  const proteinLen = caloriePct * proteinPct * circumference
  const carbsLen = caloriePct * carbsPct * circumference
  const fatLen = caloriePct * fatPct * circumference

  const gap = 2
  const proteinOffset = circumference * 0.25
  const carbsOffset = proteinOffset - proteinLen - gap
  const fatOffset = carbsOffset - carbsLen - gap

  const remaining = Math.max(goal - calories, 0)

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-700"
          />
          {/* Fat arc */}
          {fatLen > 0 && (
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke="#f87171"
              strokeWidth={strokeWidth}
              strokeDasharray={`${fatLen - gap} ${circumference - fatLen + gap}`}
              strokeDashoffset={fatOffset}
              strokeLinecap="round"
            />
          )}
          {/* Carbs arc */}
          {carbsLen > 0 && (
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={strokeWidth}
              strokeDasharray={`${carbsLen - gap} ${circumference - carbsLen + gap}`}
              strokeDashoffset={carbsOffset}
              strokeLinecap="round"
            />
          )}
          {/* Protein arc */}
          {proteinLen > 0 && (
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={strokeWidth}
              strokeDasharray={`${proteinLen - gap} ${circumference - proteinLen + gap}`}
              strokeDashoffset={proteinOffset}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">
            {calories >= goal
              ? <span className="text-red-500">{calories}</span>
              : calories
            }
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">kcal eaten</span>
          <div className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
            {remaining > 0 ? (
              <span className="text-primary-500">{remaining} left</span>
            ) : (
              <span className="text-red-500">{Math.abs(remaining)} over</span>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span className="text-gray-600 dark:text-gray-400">Protein</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-gray-600 dark:text-gray-400">Carbs</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-gray-600 dark:text-gray-400">Fat</span>
        </div>
      </div>
    </div>
  )
}
