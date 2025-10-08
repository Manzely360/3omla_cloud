import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginApi, logout as logoutApi, register as registerApi, RegisterPayload } from '../lib/auth'

interface UserProfile {
  id: number
  email: string
  username?: string | null
  is_active: boolean
  email_verified?: boolean
}

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    })
    if (!res.ok) {
      return null
    }
    const data = await res.json()
    return data as UserProfile
  } catch (error) {
    console.error('Failed to fetch profile', error)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const profile = await fetchProfile()
    setUser(profile)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginApi(email, password)
    if (response?.access_token && typeof window !== 'undefined') {
      window.localStorage.setItem('auth_token', response.access_token)
    }
    await refresh()
  }, [refresh])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerApi(payload)
    if (response?.access_token && typeof window !== 'undefined') {
      window.localStorage.setItem('auth_token', response.access_token)
    }
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await logoutApi()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
    }
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refresh,
  }), [user, loading, login, register, logout, refresh])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
