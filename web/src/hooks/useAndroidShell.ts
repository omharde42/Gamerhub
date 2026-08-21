'use client';

import { useState, useEffect } from 'react';

interface AndroidShell {
  isAndroid: boolean;
  isCapacitor: boolean;
  isNative: boolean;
  safeAreaInsets: { top: number; bottom: number; left: number; right: number };
}

export function useAndroidShell(): AndroidShell {
  const [state, setState] = useState<AndroidShell>({
    isAndroid: false,
    isCapacitor: false,
    isNative: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isCapacitor = !!(window as any).Capacitor;
    const isNative = isAndroid && isCapacitor;

    // Read safe-area insets from CSS custom properties (injected by MainActivity.java)
    const root = document.documentElement;
    const readVar = (name: string) => {
      const v = getComputedStyle(root).getPropertyValue(name).trim();
      return parseInt(v) || 0;
    };

    setState({
      isAndroid,
      isCapacitor,
      isNative,
      safeAreaInsets: {
        top: readVar('--sat'),
        bottom: readVar('--sab'),
        left: readVar('--sal'),
        right: readVar('--sar'),
      },
    });

    // Re-read on resize (rotation, IME)
    const handler = () => {
      setState((prev) => ({
        ...prev,
        safeAreaInsets: {
          top: readVar('--sat'),
          bottom: readVar('--sab'),
          left: readVar('--sal'),
          right: readVar('--sar'),
        },
      }));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return state;
}
