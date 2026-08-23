'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface KeyboardState {
  /** Height the keyboard occupies in pixels (0 when closed) */
  keyboardHeight: number;
  /** Whether the virtual keyboard is likely open */
  isKeyboardOpen: boolean;
  /** Current visual viewport height in pixels */
  viewportHeight: number;
}

/**
 * A hook that tracks the mobile virtual keyboard state using the
 * VisualViewport API. When the keyboard opens on mobile, the visual
 * viewport shrinks while the layout viewport stays the same size.
 *
 * Returns the keyboard height so you can adjust fixed-position elements
 * (like chat inputs or action toolbars) to sit above the keyboard.
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    keyboardHeight: 0,
    isKeyboardOpen: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const layoutViewportHeightRef = useRef(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );

  const handleVisualViewport = useCallback(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      // Fallback: detect change by comparing current innerHeight to stored value
      const currentHeight = window.innerHeight;
      const diff = layoutViewportHeightRef.current - currentHeight;
      // Only consider it a keyboard if the diff is significant (>100px)
      const isOpen = diff > 100;
      setState({
        keyboardHeight: isOpen ? diff : 0,
        isKeyboardOpen: isOpen,
        viewportHeight: currentHeight,
      });
      return;
    }

    const layoutHeight = layoutViewportHeightRef.current;
    const visualHeight = visualViewport.height;
    const diff = layoutHeight - visualHeight;

    // Only consider it a keyboard if the viewport shrinks significantly
    const isOpen = diff > 100;

    setState({
      keyboardHeight: isOpen ? diff : 0,
      isKeyboardOpen: isOpen,
      viewportHeight: visualHeight,
    });
  }, []);

  useEffect(() => {
    // Store the initial layout viewport height
    layoutViewportHeightRef.current = window.innerHeight;

    const visualViewport = window.visualViewport;

    if (visualViewport) {
      // Preferred: VisualViewport API (works on iOS Safari 13+, Chrome 89+)
      visualViewport.addEventListener('resize', handleVisualViewport);
      // Also listen to scroll to handle floating keyboard on iPad
      visualViewport.addEventListener('scroll', handleVisualViewport);
      handleVisualViewport(); // Initial check

      return () => {
        visualViewport.removeEventListener('resize', handleVisualViewport);
        visualViewport.removeEventListener('scroll', handleVisualViewport);
      };
    } else {
      // Fallback: window resize (less reliable but works on most Android browsers)
      window.addEventListener('resize', handleVisualViewport);
      handleVisualViewport();

      return () => {
        window.removeEventListener('resize', handleVisualViewport);
      };
    }
  }, [handleVisualViewport]);

  return state;
}

/**
 * Scrolls an element into view when focused, accounting for the keyboard.
 * Call this from an input's onFocus handler.
 */
export function scrollInputIntoView(element: HTMLElement | null) {
  if (!element || typeof window === 'undefined') return;

  // Small delay to let the keyboard start opening
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, 300);
}

/**
 * A ref callback that scrolls the element into view when it receives focus.
 * Usage: <input ref={focusScrollRef} />
 */

