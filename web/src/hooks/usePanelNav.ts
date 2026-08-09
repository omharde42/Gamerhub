'use client';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useOverlayStore, type PanelType } from '@/store/overlayStore';

/** Route that each panel type represents (absent = always open, e.g. Popular Games). */
const PANEL_ROUTES: Partial<Record<PanelType, string>> = {
  profile: '/profile/',
  search: '/search',
  notifications: '/notifications',
  tournaments: '/tournaments',
  settings: '/profile/settings',
  connections: '/connections',
};

/**
 * Returns a helper that opens a page-panel from navigation.
 * If the user is already on the page that the panel represents,
 * the panel is skipped (avoids showing a panel over the same page).
 */
export function usePanelNav() {
  const pathname = usePathname();
  const openPanel = useOverlayStore((s) => s.openPanel);

  const openPanelFromNav = useCallback(
    (type: PanelType, opts?: { username?: string }) => {
      const route = PANEL_ROUTES[type];
      // Panels without a representative route (e.g. Popular Games) always open.
      if (!route) {
        openPanel(type, opts);
        return;
      }

      let alreadyHere = false;
      if (type === 'profile') {
        // Only skip when already viewing the user's OWN profile.
        alreadyHere =
          pathname === '/profile' ||
          (!!opts?.username && pathname === `/profile/${opts.username}`);
      } else if (route.endsWith('/')) {
        alreadyHere = pathname === route.slice(0, -1) || !!pathname?.startsWith(route);
      } else {
        alreadyHere = pathname === route || !!pathname?.startsWith(route + '/');
      }

      if (alreadyHere) return;
      openPanel(type, opts);
    },
    [pathname, openPanel]
  );

  return openPanelFromNav;
}
