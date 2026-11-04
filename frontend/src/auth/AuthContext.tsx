import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStore, type Me } from '../api'

interface AuthState {
  me: Me | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    tokenStore.clear()
    setMe(null)
  }, [])

  const refresh = useCallback(async () => {
    setMe(await api.me())
  }, [])

  // restore the session after a page reload
  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    refresh()
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout, refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await api.login(email, password)
      tokenStore.set(access_token)
      await refresh()
    },
    [refresh],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      await api.register(email, password)
      await login(email, password) // sign straight in after registering
    },
    [login],
  )

  const value = useMemo(
    () => ({ me, loading, login, register, logout, refresh }),
    [me, loading, login, register, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}