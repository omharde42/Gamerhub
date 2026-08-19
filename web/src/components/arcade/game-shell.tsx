'use client';

import { X, RotateCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameShellProps {
  title: string;
  accent: string;
  hint?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Fullscreen overlay hosting a mini-game: neon header with close/restart,
 * a scroll-safe game area sized to the viewport, and a control hint footer.
 */
export function GameShell({ title, accent, hint, onClose, children }: GameShellProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accent}44, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="rounded-lg border border-border/60 p-2 text-muted-foreground transition hover:bg-card hover:text-foreground"
              aria-label="Close game"
            >
              <X className="h-5 w-5" />
            </button>
            <h2
              className="truncate text-lg font-bold tracking-tight"
              style={{ textShadow: `0 0 18px ${accent}88` }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-auto flex items-center justify-center p-3">
          {children}
        </div>

        {hint && (
          <div className="relative z-10 flex items-center justify-center gap-2 border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
            <Trophy className="h-3 w-3" />
            <span className="text-center">{hint}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}