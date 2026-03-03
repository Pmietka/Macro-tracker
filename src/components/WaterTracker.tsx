import React from 'react'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useStore } from '../store/useStore'

interface WaterTrackerProps {
  date: string
}

const QUICK_ADD_AMOUNTS = [150, 250, 350, 500]

export const WaterTracker: React.FC<WaterTrackerProps> = ({ date }) => {
  const waterIntake = useStore(s => s.diary[date]?.waterIntake ?? 0)
  const goalMl = useStore(s => s.goals.water)
  const addWater = useStore(s => s.addWater)
  const setWaterIntake = useStore(s => s.setWaterIntake)

  const pct = Math.min((waterIntake / goalMl) * 100, 100)
  const glasses = Math.round(waterIntake / 250)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Water</h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-blue-500">{waterIntake}</span>
          <span> / {goalMl} ml</span>
        </div>
      </div>

      {/* Water fill visualization */}
      <div className="relative h-3 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-400 rounded-full progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Glass icons */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {Array.from({ length: Math.ceil(goalMl / 250) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setWaterIntake(date, (i + 1) * 250)}
            className="transition-transform hover:scale-110"
            title={`${(i + 1) * 250}ml`}
          >
            <Droplets
              className={`w-5 h-5 ${i < glasses ? 'text-blue-400' : 'text-gray-200 dark:text-gray-700'}`}
            />
          </button>
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {QUICK_ADD_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => addWater(date, amount)}
            className="flex-1 text-xs py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors"
          >
            +{amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
          </button>
        ))}
        <button
          onClick={() => addWater(date, -250)}
          className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 rounded-lg transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
