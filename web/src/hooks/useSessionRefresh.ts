'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

// Silently validates the persisted session against the server and refreshes
// the cached user profile in the background. Never blocks rendering.
export function useSessionRefresh(ready: boolean) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!ready || !isAuthenticated) return;

    let cancelled = false;

    const validate = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (cancelled || !data?.data) return;
        useAuthStore.getState().setUser(data.data);
      } catch (err: any) {
        // 401s are handled by the axios refresh queue. On refresh failure the
        // interceptor already logs out and redirects. Swallow everything else
        // so an offline start never blocks the UI.
        if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
          return;
        }
      }
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [ready, isAuthenticated]);
}
