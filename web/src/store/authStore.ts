import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

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

// Dual Synchronous (localStorage) + Native (Capacitor Preferences) Storage Adapter
const dualStorageAdapter: StateStorage = {
  getItem: (name: string): string | Promise<string | null> | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = localStorage.getItem(name);
      if (localVal) return localVal;
    }
    return Preferences.get({ key: name }).then((res) => res.value || null);
  },
  setItem: (name: string, value: string): void | Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.setItem(name, value); } catch {}
    }
    return Preferences.set({ key: name, value });
  },
  removeItem: (name: string): void | Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try { localStorage.removeItem(name); } catch {}
    }
    return Preferences.remove({ key: name });
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

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
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'gamerhub-auth',
      storage: createJSONStorage(() => dualStorageAdapter),
    }
  )
);
