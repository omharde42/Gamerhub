import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import type { User } from '@/types';

// Simple localStorage adapter with error checking
const webStorageAdapter: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(name, value);
      } catch {}
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(name);
      } catch {}
    }
  },
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
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
        // Double backup the tokens directly to separate localStorage keys for raw non-Zustand APIs/sockets
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          } catch {}
        }
        set((state) => ({
          accessToken,
          refreshToken,
          isAuthenticated: !!(state.user || accessToken),
        }));
      },

      login: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          } catch {}
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } catch {}
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'gamerhub-auth',
      storage: createJSONStorage(() => webStorageAdapter),
    }
  )
);
