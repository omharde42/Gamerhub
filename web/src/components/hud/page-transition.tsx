'use client';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PageTransitionProps {
  pathname: string;
  children: React.ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Direction-aware cinematic slide transition. Reads the Next.js history
 * index (`window.history.state.idx`) synchronously so forward navigation
 * slides the new page in from the right and back navigation from the left,
 * like a carousel — plus a blur/scale fade and the neon sweep bar.
 */
export function PageTransition({ pathname, children }: PageTransitionProps) {
  const prevIdxRef = useRef<number | null>(null);

  const idx =
    typeof window !== 'undefined'
      ? ((window.history.state as { idx?: number } | null)?.idx ?? null)
      : null;

  const direction: 1 | -1 =
    idx !== null && prevIdxRef.current !== null && idx > prevIdxRef.current ? 1 : -1;

  useEffect(() => {
    prevIdxRef.current = idx;
  }, [idx]);

  const enterX = direction * 96;
  const exitX = direction * -96;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="cinema-page w-full min-w-0"
        initial={{ opacity: 0, x: enterX, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: exitX, y: -12, scale: 0.99 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <span className="cinema-sweep" aria-hidden />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}