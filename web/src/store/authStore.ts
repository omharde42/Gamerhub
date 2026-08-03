import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { User } from '@/types';

// Simple localStorage adapter (removed Capacitor dependency for web-only)
const webStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem(name); } catch { return null; }
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(name, value); } catch {}
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(name); } catch {}
    }
  },
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  lastPath: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLastPath: (path: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      lastPath: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken,
          isAuthenticated: !!(state.user || accessToken),
        }));
      },

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, lastPath: null });
      },

      setLastPath: (path) => {
        set({ lastPath: path });
      },
    }),
    {
      name: 'gamerhub-auth',
      storage: createJSONStorage(() => webStorageAdapter),
    }
  )
);
