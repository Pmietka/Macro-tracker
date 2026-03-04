import React from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useStore } from '../store/useStore'
import { GoogleUser } from '../store/useStore'

function decodeJwt(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

export const LoginPage: React.FC = () => {
  const setGoogleUser = useStore(s => s.setGoogleUser)
  const updateProfile = useStore(s => s.updateProfile)

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) return
    const payload = decodeJwt(response.credential)
    const user: GoogleUser = {
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
      sub: payload.sub as string,
    }
    setGoogleUser(user)
    // Pre-fill the profile name with the Google name
    if (payload.name) updateProfile({ name: payload.name as string })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center px-6">
      {/* Logo / branding */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-green-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="20" fill="white" fillOpacity="0.15" />
            {/* Simple plate icon */}
            <circle cx="24" cy="24" r="13" stroke="white" strokeWidth="2.5" />
            <path d="M18 24 Q20 19 24 24 Q28 29 30 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="24" cy="24" r="2.5" fill="white" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">MacroFit</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Your AI-powered nutrition tracker</p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-10 max-w-xs">
        {['🍽️ Log food by chatting', '⚖️ Track weight', '📊 Visualize progress', '🤖 Claude AI built-in'].map(f => (
          <span key={f} className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 px-3 py-1 rounded-full">
            {f}
          </span>
        ))}
      </div>

      {/* Sign-in card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 w-full max-w-sm text-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Get started</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to save your data across devices</p>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Google login failed')}
            theme="outline"
            shape="rectangular"
            size="large"
            text="signin_with"
          />
        </div>
        <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
          Your data is stored locally on your device.
        </p>
      </div>
    </div>
  )
}
