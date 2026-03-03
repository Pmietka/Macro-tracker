import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, BookOpen, TrendingUp, Target, User } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export const BottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-inset-bottom">
    <div className="max-w-2xl mx-auto flex">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              isActive
                ? 'text-primary-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
              <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
)
