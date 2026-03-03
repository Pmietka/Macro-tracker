import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store/useStore'
import { BottomNav } from './components/Layout/BottomNav'
import { Dashboard } from './pages/Dashboard'
import { Diary } from './pages/Diary'
import { Progress } from './pages/Progress'
import { Goals } from './pages/Goals'
import { Profile } from './pages/Profile'

export const App: React.FC = () => {
  const darkMode = useStore(s => s.darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <BrowserRouter>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
