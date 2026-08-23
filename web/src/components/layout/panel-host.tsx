'use client';

import { useOverlayStore } from '@/store/overlayStore';

/**
 * PanelHost is disabled for page-level navigation so pages always occupy 100% full screen.
 */
export function PanelHost() {
  const panel = useOverlayStore((s) => s.panel);
  if (!panel) return null;
  return null;
}
