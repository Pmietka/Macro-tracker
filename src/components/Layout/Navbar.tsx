import React from 'react'
import { Moon, Sun, Flame } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface NavbarProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'MacroFit Pro', subtitle, action }) => {
  const darkMode = useStore(s => s.darkMode)
  const toggleDarkMode = useStore(s => s.toggleDarkMode)
  const streak = useStore(s => s.streak)

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {streak.current > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                {streak.current}
              </span>
            </div>
          )}

          {action}

          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label="Toggle dark mode"
          >
            {darkMode
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5" />
            }
          </button>
        </div>
      </div>
    </header>
  )
}
