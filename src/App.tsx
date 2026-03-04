import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useStore } from './store/useStore'
import { BottomNav } from './components/Layout/BottomNav'
import { ChatInterface } from './components/Chat/ChatInterface'
import { Dashboard } from './pages/Dashboard'
import { Diary } from './pages/Diary'
import { Progress } from './pages/Progress'
import { Goals } from './pages/Goals'
import { Profile } from './pages/Profile'
import { LoginPage } from './pages/LoginPage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? ''

export const App: React.FC = () => {
  const darkMode = useStore(s => s.darkMode)
  const googleUser = useStore(s => s.googleUser)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {!googleUser ? (
          <LoginPage />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <BottomNav />
            <ChatInterface />
          </BrowserRouter>
        )}
      </div>
    </GoogleOAuthProvider>
  )
}
