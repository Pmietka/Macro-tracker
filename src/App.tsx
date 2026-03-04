import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useStore } from './store/useStore'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BottomNav } from './components/Layout/BottomNav'
import { ChatInterface } from './components/Chat/ChatInterface'
import { Dashboard } from './pages/Dashboard'
import { Diary } from './pages/Diary'
import { Progress } from './pages/Progress'
import { Goals } from './pages/Goals'
import { Profile } from './pages/Profile'
import { LoginPage } from './pages/LoginPage'
import { InstallPrompt } from './components/InstallPrompt'

const SyncIndicator: React.FC = () => {
  const { syncStatus } = useAuth()
  if (syncStatus === 'idle') return null

  return (
    <div className="fixed top-2 right-2 z-50 flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-full px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 animate-fade-in">
      {syncStatus === 'saving' && (
        <><Loader2 className="w-3 h-3 animate-spin text-gray-400" /> Saving…</>
      )}
      {syncStatus === 'saved' && (
        <><CheckCircle className="w-3 h-3 text-green-500" /> Saved</>
      )}
      {syncStatus === 'error' && (
        <><AlertCircle className="w-3 h-3 text-red-500" /> Sync error</>
      )}
    </div>
  )
}

const AppContent: React.FC = () => {
  const darkMode = useStore(s => s.darkMode)
  const { user, loading } = useAuth()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <BottomNav />
      <ChatInterface />
      <SyncIndicator />
      <InstallPrompt />
    </div>
  )
}

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </BrowserRouter>
)
