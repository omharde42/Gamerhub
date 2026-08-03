'use client';

import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const hasValidated = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasValidated.current) {
      hasValidated.current = true;
      // Silently validate token and refresh user profile data in the background
      api.get('/auth/me')
        .then(({ data }: { data: any }) => {
          if (data?.data) {
            setUser(data.data);
          }
        })
        .catch((err: any) => {
          // If the server explicitly rejected the token (401/403), sign out
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
          }
        });
    }
  }, [isAuthenticated, setUser, logout]);

  return { user, isAuthenticated, setUser, logout };
}
