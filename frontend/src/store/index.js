import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
)

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggle: () => set((s) => {
        const newDark = !s.isDark
        document.documentElement.classList.toggle('dark', newDark)
        return { isDark: newDark }
      }),
      init: () => {
        const stored = JSON.parse(localStorage.getItem('theme-storage') || '{}')
        if (stored?.state?.isDark) document.documentElement.classList.add('dark')
      }
    }),
    { name: 'theme-storage' }
  )
)
