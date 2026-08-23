import { create } from 'zustand';

/** The page-level panels that can open as premium overlays on top of the app. */
export type PanelType =
  | 'profile'
  | 'search'
  | 'notifications'
  | 'tournaments'
  | 'settings'
  | 'connections'
  | 'games';

interface OverlayState {
  /** Number of premium overlays currently open (drives the background focus FX). */
  activeOverlays: number;
  /** Currently open page-panel (null when none). */
  panel: PanelType | null;
  /** Username used by the profile panel. */
  panelUsername: string | null;
  registerOverlay: () => void;
  unregisterOverlay: () => void;
  openPanel: (type: PanelType, opts?: { username?: string }) => void;
  closePanel: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  activeOverlays: 0,
  panel: null,
  panelUsername: null,
  registerOverlay: () => set((s) => ({ activeOverlays: s.activeOverlays + 1 })),
  unregisterOverlay: () => set((s) => ({ activeOverlays: Math.max(0, s.activeOverlays - 1) })),
  openPanel: (type, opts) => set({ panel: type, panelUsername: opts?.username ?? null }),
  closePanel: () => set({ panel: null, panelUsername: null }),
}));

/** True while any premium overlay (modal/drawer/panel) is open. */
export const useOverlayActive = () => useOverlayStore((s) => s.activeOverlays > 0);
