import React from 'react'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  unit?: string
  color: string
  bgColor: string
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label, current, goal, unit = 'g', color, bgColor
}) => {
  const pct = Math.min((current / Math.max(goal, 1)) * 100, 100)
  const isOver = current > goal

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className={`font-semibold ${color}`}>{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          <span className={`font-medium ${isOver ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
            {current.toFixed(current < 10 ? 1 : 0)}{unit}
          </span>
          <span className="text-gray-400"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${bgColor} rounded-full progress-bar-fill`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface MiniMacroProps {
  label: string
  value: number
  unit?: string
  color: string
}

export const MiniMacro: React.FC<MiniMacroProps> = ({ label, value, unit = 'g', color }) => (
  <div className="flex flex-col items-center">
    <span className={`text-base font-bold ${color}`}>
      {value >= 100 ? Math.round(value) : value.toFixed(1)}{unit}
    </span>
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
  </div>
)
