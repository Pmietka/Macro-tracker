import React, { useState, useEffect } from 'react'
import { Timer, Square } from 'lucide-react'
import { useStore } from '../store/useStore'

const PRESETS = [
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'OMAD',  hours: 23 },
]

const fmt = (ms: number) => {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const FastingTimer: React.FC = () => {
  const fastingSession = useStore(s => s.fastingSession)
  const startFasting   = useStore(s => s.startFasting)
  const stopFasting    = useStore(s => s.stopFasting)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!fastingSession) return
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [fastingSession?.startTime])

  if (!fastingSession) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-500" /> Fasting Timer
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => startFasting(p.hours)}
              className="py-2 text-sm font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const elapsed   = Date.now() - fastingSession.startTime
  const targetMs  = fastingSession.targetHours * 3600 * 1000
  const remaining = Math.max(0, targetMs - elapsed)
  const pct       = Math.min((elapsed / targetMs) * 100, 100)
  const done      = elapsed >= targetMs
  const r         = 34
  const circ      = 2 * Math.PI * r

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-500" />
          {done ? 'Fast complete! 🎉' : `${fastingSession.targetHours}:${24 - fastingSession.targetHours} Fast`}
        </h3>
        <button
          onClick={stopFasting}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="End fast"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* Progress ring */}
        <div className="relative w-[76px] h-[76px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={r} stroke="#e5e7eb" strokeWidth="7" fill="none" />
            <circle
              cx="40" cy="40" r={r}
              stroke={done ? '#22c55e' : '#a855f7'}
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
            {Math.round(pct)}%
          </span>
        </div>

        <div className="space-y-1">
          <div>
            <p className="text-xs text-gray-500">Elapsed</p>
            <p className="text-lg font-bold text-purple-500">{fmt(elapsed)}</p>
          </div>
          {!done && (
            <div>
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{fmt(remaining)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
