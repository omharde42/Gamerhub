'use client';
import { AnimatePresence, motion } from 'framer-motion';

interface PageTransitionProps {
  pathname: string;
  children: React.ReactNode;
}

/**
 * Route transition + cinematic entrance shell. Keyed on pathname so every
 * navigation remounts the page content with a wipe-out exit and a
 * blur/rise/scale entrance, plus a neon sweep bar across the top.
 */
export function PageTransition({ pathname, children }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="cinema-page w-full min-w-0"
        initial={{ opacity: 0, y: 26, scale: 0.985, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, scale: 0.99, filter: 'blur(4px)' }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="cinema-sweep" aria-hidden />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}