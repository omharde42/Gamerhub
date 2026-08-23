'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type PanelType } from '@/store/overlayStore';

const PANEL_ROUTES: Record<PanelType, string> = {
  profile: '/profile/',
  search: '/search',
  notifications: '/notifications',
  tournaments: '/tournaments',
  settings: '/profile/settings',
  connections: '/connections',
  games: '/explore',
};

/**
 * Navigates directly to full page routes.
 */
export function usePanelNav() {
  const router = useRouter();

  const openPanelFromNav = useCallback(
    (type: PanelType, opts?: { username?: string }) => {
      if (type === 'profile' && opts?.username) {
        router.push(`/profile/${opts.username}`);
        return;
      }
      const target = PANEL_ROUTES[type] || '/dashboard';
      router.push(target);
    },
    [router]
  );

  return openPanelFromNav;
}
