import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  syncStatus: 'idle' | 'saving' | 'saved' | 'error'
}

const AuthContext = createContext<AuthContextValue>(null!)

export const useAuth = () => useContext(AuthContext)

const SYNC_FIELDS = [
  'profile', 'currentWeightKg', 'goals', 'diary', 'weightLog',
  'mealTemplates', 'customFoods', 'recentFoodIds', 'streak',
  'darkMode', 'bodyMeasurements', 'fastingSession',
  // Note: progressPhotos excluded by default — can be large (base64 images)
  // Add 'progressPhotos' here if cross-device photo sync is desired
] as const

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userRef = useRef<User | null>(null)
  const isHydratingRef = useRef(false)

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .single()

      if (!error && data?.data) {
        isHydratingRef.current = true
        useStore.getState().hydrateStore(data.data)
        setTimeout(() => { isHydratingRef.current = false }, 200)
      }
    } catch {
      // No existing data for user — start fresh
    }
  }

  const saveUserData = async (userId: string, storeData: Record<string, unknown>) => {
    setSyncStatus('saving')
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ user_id: userId, data: storeData }, { onConflict: 'user_id' })

      setSyncStatus(error ? 'error' : 'saved')
      if (!error) setTimeout(() => setSyncStatus('idle'), 2000)
    } catch {
      setSyncStatus('error')
    }
  }

  // Bootstrap session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-sync store changes to Supabase (debounced 2s)
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      if (!userRef.current || isHydratingRef.current) return

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const storeData: Record<string, unknown> = {}
        for (const key of SYNC_FIELDS) {
          storeData[key] = (state as unknown as Record<string, unknown>)[key]
        }
        saveUserData(userRef.current!.id, storeData)
      }, 2000)
    })

    return () => {
      unsubscribe()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error as Error | null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    userRef.current = null
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, syncStatus }}>
      {children}
    </AuthContext.Provider>
  )
}
