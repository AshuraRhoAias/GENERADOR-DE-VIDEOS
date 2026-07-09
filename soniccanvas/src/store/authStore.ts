import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  plan: 'free' | '1m' | '3m' | '6m' | '12m'
  planExpiresAt: number | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Simulated auth - replace with real API call
        await new Promise((r) => setTimeout(r, 800))
        if (email && password) {
          set({
            isAuthenticated: true,
            token: 'mock-token-' + Date.now(),
            user: {
              id: 'user_1',
              name: email.split('@')[0],
              email,
              avatarUrl: null,
              plan: 'free',
              planExpiresAt: null,
            },
          })
        } else {
          throw new Error('Credenciales inválidas')
        }
      },

      register: async (name, email, _password) => {
        await new Promise((r) => setTimeout(r, 800))
        set({
          isAuthenticated: true,
          token: 'mock-token-' + Date.now(),
          user: {
            id: 'user_' + Date.now(),
            name,
            email,
            avatarUrl: null,
            plan: 'free',
            planExpiresAt: null,
          },
        })
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    { name: 'soniccanvas-auth' }
  )
)
