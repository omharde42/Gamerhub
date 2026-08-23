'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/** Do not hide the navigation while the page is near the top (px). */
const HIDE_OFFSET = 80;

/**
 * Cumulative distance (px) that must be scrolled downward before hiding.
 * Micro-scrolls / light touches never accumulate enough to trigger a hide.
 */
const HIDE_DISTANCE = 48;

/** How long (ms) without scrolling before the navigation auto-reappears. */
const IDLE_DELAY = 400;

/**
 * Smart auto-hide navigation, Instagram-style.
 *
 * - Scrolling down past a threshold hides the navigation (slide out).
 * - Scrolling up reveals it immediately (slide in).
 * - Stopping for ~400ms reveals it automatically.
 *
 * The scroll listener is passive and rAF-throttled, so it never triggers
 * state updates on every pixel scrolled — only when a threshold is crossed.
 */
export function useAutoHideNav(): boolean {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  const hiddenRef = useRef(false);
  const lastY = useRef(0);
  const downDistance = useRef(0);
  const ticking = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only update React state when the value actually changes.
  const apply = useCallback((next: boolean) => {
    if (hiddenRef.current === next) return;
    hiddenRef.current = next;
    setHidden(next);
  }, []);

  // Always reset to visible when navigating to a new page.
  useEffect(() => {
    lastY.current = window.scrollY;
    downDistance.current = 0;
    apply(false);
  }, [pathname, apply]);

  useEffect(() => {
    lastY.current = window.scrollY;
    apply(false);

    const clearIdle = () => {
      if (idleTimer.current !== null) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
    };

    const onScroll = () => {
      // Any scroll activity defers the "auto show after idle" timer.
      clearIdle();
      idleTimer.current = setTimeout(() => apply(false), IDLE_DELAY);

      if (ticking.current) return;
      ticking.current = true;

      window.requestAnimationFrame(() => {
        ticking.current = false;
        const y = window.scrollY;
        const delta = y - lastY.current;
        lastY.current = y;

        // Never hide while at (or near) the top of the page.
        if (y <= HIDE_OFFSET) {
          downDistance.current = 0;
          apply(false);
          return;
        }

        if (delta > 0) {
          // Scrolling down: accumulate distance so slow scrolls still hide,
          // but micro-scrolls never trigger an animation.
          downDistance.current += delta;
          if (downDistance.current >= HIDE_DISTANCE) {
            downDistance.current = 0;
            apply(true);
          }
        } else if (delta < 0) {
          // Scrolling up (even slightly): reveal the navigation immediately.
          // Showing is always safe — the hide threshold prevents any flicker.
          downDistance.current = 0;
          apply(false);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearIdle();
    };
  }, [apply]);

  return hidden;
}
