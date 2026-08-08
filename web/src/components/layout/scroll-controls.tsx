'use client';
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ScrollControlsProps {
  /**
   * Mirrors the auto-hide nav state: controls appear only while the
   * navigation bars are hidden, so they never overlap the UI chrome.
   */
  hidden?: boolean;
}

/**
 * Immersive scroll helpers that only appear when the navigation bars are
 * auto-hidden on scroll:
 *
 * 1. A slim gradient progress bar pinned to the very top of the viewport,
 *    showing how far down the page the user has scrolled.
 * 2. A floating "back to top" button with a circular progress ring that
 *    fills as the user scrolls. Clicking it smoothly scrolls to the top.
 *
 * Both use Framer Motion motion-values (`useScroll`/`useSpring`), which are
 * GPU-driven and never trigger React re-renders while scrolling.
 */
export function ScrollControls({ hidden = false }: ScrollControlsProps) {
  const { scrollYProgress } = useScroll();
  // Spring-smoothed progress for the top bar (silky, no jitter).
  const barScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  // Ring offset derived directly from the scroll progress motion-value.
  const ringOffset = useTransform(scrollYProgress, [0, 1], [RING_CIRCUMFERENCE, 0]);

  const scrollToTop = () => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Top reading progress bar */}
      <AnimatePresence>
        {hidden && (
          <motion.div
            key="scroll-progress-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 inset-x-0 z-30 h-[3px] pointer-events-none"
            aria-hidden="true"
          >
            <motion.div
              style={{ scaleX: barScale }}
              className="h-full w-full origin-left bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-pink shadow-[0_0_12px_rgba(124,58,237,0.55)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-to-top FAB with progress ring */}
      <AnimatePresence>
        {hidden && (
          <motion.button
            key="scroll-to-top-fab"
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Back to top"
            className="fixed z-[60] bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 md:right-6 h-12 w-12 rounded-full bg-background/85 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/15 hover:border-primary/60 hover:shadow-primary/30 transition-[border-color,box-shadow] flex items-center justify-center group"
          >
            <svg
              className="absolute inset-0 h-full w-full -rotate-90"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="scroll-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="stop-gaming-purple" />
                  <stop offset="50%" className="stop-gaming-cyan" />
                  <stop offset="100%" className="stop-gaming-pink" />
                </linearGradient>
              </defs>
              {/* Track */}
              <circle
                cx="24"
                cy="24"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3"
                className="stroke-border/60"
              />
              {/* Progress ring (motion-value driven, no re-renders) */}
              <motion.circle
                cx="24"
                cy="24"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="url(#scroll-ring-gradient)"
                strokeDasharray={RING_CIRCUMFERENCE}
                style={{ strokeDashoffset: ringOffset }}
              />
            </svg>
            <ArrowUp className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
