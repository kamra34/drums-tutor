import { create } from 'zustand'
import {
  AuthUser, apiRegister, apiLogin, apiGetMe,
  setToken, getToken, ApiError,
} from '@shared/services/apiClient'
import { clearUserStores, initUserStores } from '@shared/stores/storeUtils'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  register: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: !!getToken(), // loading if we have a token to verify
  error: null,

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await apiRegister(email, password, displayName)
      setToken(token)
      clearUserStores()
      initUserStores(user.id)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Registration failed'
      set({ error: msg, isLoading: false })
      throw e
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await apiLogin(email, password)
      setToken(token)
      clearUserStores()
      initUserStores(user.id)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed'
      set({ error: msg, isLoading: false })
      throw e
    }
  },

  logout: () => {
    setToken(null)
    clearUserStores()
    set({ user: null, isAuthenticated: false, error: null })
  },

  checkAuth: async () => {
    const token = getToken()
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const { user } = await apiGetMe()
      initUserStores(user.id)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      setToken(null)
      clearUserStores()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

// Listen for auth expiry events from apiClient
window.addEventListener('auth:expired', () => {
  useAuthStore.getState().logout()
})
