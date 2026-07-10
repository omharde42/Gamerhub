import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: any, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'gamerhub-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state?.refreshToken) {
          localStorage.setItem('accessToken', state.accessToken);
          localStorage.setItem('refreshToken', state.refreshToken);
        }
      },
    }
  )
);
