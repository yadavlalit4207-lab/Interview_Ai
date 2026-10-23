import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserProfile } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { storageService } from '@/lib/storageService'
import { apiClient, tokenStorage, isBackendAvailable } from '@/lib/apiClient'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    display_name?: string
  }
}

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isDemoMode: boolean
  signIn: (email: string, password?: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signInDemoUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_AUTH_KEY = 'interviewace_auth_user'

const DEMO_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alex.rivera@interviewace.dev',
  user_metadata: {
    display_name: 'Alex Rivera',
  },
}

const DEMO_PROFILE: UserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alex.rivera@interviewace.dev',
  display_name: 'Alex Rivera',
  career_stage: 'Working professional',
  target_role: 'Full-Stack Developer',
  experience_level: 'Intermediate',
  preferred_language: 'English',
  target_company: 'Top Tech / High-Growth SaaS',
  preparation_goals: 'Master distributed systems design and behavioral STAR responses.',
  created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  updated_at: new Date().toISOString(),
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hasBackend, setHasBackend] = useState<boolean>(false)

  const isDemoMode = !hasBackend && !isSupabaseConfigured()

  useEffect(() => {
    async function initAuth() {
      try {
        const backendOnline = await isBackendAvailable()
        setHasBackend(backendOnline)

        // 1. Try Backend API with stored JWT token
        if (backendOnline && tokenStorage.get()) {
          try {
            const data = await apiClient.auth.getMe()
            if (data?.user) {
              const au: AuthUser = {
                id: data.user.id,
                email: data.user.email,
                user_metadata: { display_name: data.user.display_name },
              }
              setUser(au)
              setProfile(data.profile)
              localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(au))
              setIsLoading(false)
              return
            }
          } catch {
            tokenStorage.remove()
          }
        }

        // 2. Try Supabase if configured
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata,
            }
            setUser(authUser)
            const p = await storageService.getProfile(session.user.id)
            setProfile(p)
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (newSession?.user) {
                const au: AuthUser = {
                  id: newSession.user.id,
                  email: newSession.user.email || '',
                  user_metadata: newSession.user.user_metadata,
                }
                setUser(au)
                const p = await storageService.getProfile(newSession.user.id)
                setProfile(p)
              } else {
                setUser(null)
                setProfile(null)
              }
            }
          )

          setIsLoading(false)
          return () => {
            subscription.unsubscribe()
          }
        }

        // 3. Fallback: Local storage session check (offline studio mode)
        const savedUser = localStorage.getItem(LOCAL_AUTH_KEY)
        if (savedUser) {
          const parsed = JSON.parse(savedUser) as AuthUser
          setUser(parsed)
          const p = await storageService.getProfile(parsed.id)
          setProfile(p || (parsed.id === DEMO_USER.id ? DEMO_PROFILE : null))
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true)
    try {
      const backendOnline = await isBackendAvailable()

      // Priority 1: Backend API
      if (backendOnline && password) {
        try {
          const res = await apiClient.auth.login(email, password)
          const authUser: AuthUser = {
            id: res.user.id,
            email: res.user.email,
            user_metadata: { display_name: res.user.display_name },
          }
          setUser(authUser)
          setProfile(res.profile)
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser))
          return
        } catch (err) {
          // If backend returned explicit error (like wrong password), rethrow
          throw err
        }
      }

      // Priority 2: Supabase
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: password || '',
        })
        if (error) throw error
        return
      }

      // Priority 3: Local Offline Mode
      const authUser: AuthUser = {
        id: email === DEMO_USER.email ? DEMO_USER.id : crypto.randomUUID(),
        email,
        user_metadata: {
          display_name: email.split('@')[0],
        },
      }
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser))
      setUser(authUser)

      let p = await storageService.getProfile(authUser.id)
      if (!p) {
        p = {
          id: authUser.id,
          email: authUser.email,
          display_name: email.split('@')[0],
          career_stage: 'Working professional',
          target_role: 'Software Engineer',
          experience_level: 'Intermediate',
          preferred_language: 'English',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        await storageService.upsertProfile(p)
      }
      setProfile(p)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true)
    try {
      const backendOnline = await isBackendAvailable()

      // Priority 1: Backend API
      if (backendOnline) {
        try {
          const res = await apiClient.auth.register(email, password, displayName)
          const authUser: AuthUser = {
            id: res.user.id,
            email: res.user.email,
            user_metadata: { display_name: res.user.display_name },
          }
          setUser(authUser)
          setProfile(res.profile)
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser))
          return
        } catch (err) {
          throw err
        }
      }

      // Priority 2: Supabase
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        })
        if (error) throw error
        return
      }

      // Priority 3: Local Offline Mode
      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        user_metadata: { display_name: displayName },
      }
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(newUser))
      setUser(newUser)

      const newProfile: UserProfile = {
        id: newUser.id,
        email,
        display_name: displayName,
        career_stage: 'Fresher',
        target_role: 'Software Engineer',
        experience_level: 'Beginner',
        preferred_language: 'English',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      await storageService.upsertProfile(newProfile)
      setProfile(newProfile)
    } finally {
      setIsLoading(false)
    }
  }

  const signInDemoUser = async () => {
    setIsLoading(true)
    try {
      const backendOnline = await isBackendAvailable()
      if (backendOnline) {
        try {
          const res = await apiClient.auth.demoLogin()
          const authUser: AuthUser = {
            id: res.user.id,
            email: res.user.email,
            user_metadata: { display_name: res.user.display_name },
          }
          setUser(authUser)
          setProfile(res.profile)
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authUser))
          return
        } catch (err) {
          console.warn('Backend demo login failed, falling back to local demo profile:', err)
        }
      }

      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(DEMO_USER))
      setUser(DEMO_USER)
      await storageService.upsertProfile(DEMO_PROFILE)
      setProfile(DEMO_PROFILE)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await apiClient.auth.logout()
    } catch {
      // ignore error
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch {
        // ignore error
      }
    }

    localStorage.removeItem(LOCAL_AUTH_KEY)
    tokenStorage.remove()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return
    const current = profile || {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email.split('@')[0],
      career_stage: 'Working professional' as const,
      target_role: 'Software Engineer',
      experience_level: 'Intermediate' as const,
      preferred_language: 'English',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    } as UserProfile

    const backendOnline = await isBackendAvailable()
    if (backendOnline) {
      try {
        const saved = await apiClient.profile.update(updates)
        setProfile(saved)
        return
      } catch (err) {
        console.warn('Backend profile update failed, using local storage fallback:', err)
      }
    }

    const saved = await storageService.upsertProfile(updated)
    setProfile(saved)
  }

  const resetPassword = async (email: string) => {
    const backendOnline = await isBackendAvailable()
    if (backendOnline) {
      await apiClient.auth.forgotPassword(email)
      return
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
    } else {
      // Local demo mode simulation
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        signInDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
