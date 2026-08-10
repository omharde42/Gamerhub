'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOverlayStore } from '@/store/overlayStore';

export type PremiumModalVariant = 'center' | 'bottom' | 'left' | 'right' | 'full';
export type PremiumModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Placement of the panel. Defaults to a centered dialog. */
  variant?: PremiumModalVariant;
  /** Max width for centered dialogs / desktop bottom sheets. */
  size?: PremiumModalSize;
  /** Extra classes for the panel itself. */
  className?: string;
  /** Extra classes for the dimming overlay. */
  overlayClassName?: string;
  /** Slim sticky header bar (replaces the floating close button). */
  header?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  /** Allow swipe-down to dismiss (mobile bottom sheets). Defaults to true for bottom sheets. */
  swipeToClose?: boolean;
  /** Dim + blur + scale the app behind. Defaults to true. */
  dimBackground?: boolean;
  /** Skip the modal chrome (header/close/scroll wrapper) and let children fill the panel. */
  bare?: boolean;
  zIndex?: number;
  /** Animation duration in seconds (250–350ms recommended). */
  transitionDuration?: number;
  /** Accessible label for the dialog. */
  title?: string;
  /** Called after the close (exit) animation finishes. */
  onExitComplete?: () => void;
}

const EASE = [0.32, 0.72, 0, 1] as const;

const SIZE_MAX_W: Record<PremiumModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-3xl',
  xl: 'sm:max-w-5xl',
  full: 'sm:max-w-full',
};

const SWIPE_THRESHOLD = 110;
const SWIPE_VELOCITY = 500;

export function PremiumModal({
  open,
  onClose,
  children,
  variant = 'center',
  size = 'md',
  className,
  overlayClassName,
  header,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  swipeToClose,
  dimBackground = true,
  bare = false,
  zIndex = 80,
  transitionDuration = 0.3,
  title,
  onExitComplete,
}: PremiumModalProps) {
  const registerOverlay = useOverlayStore((s) => s.registerOverlay);
  const unregisterOverlay = useOverlayStore((s) => s.unregisterOverlay);
  const reduceMotion = useReducedMotion();
  const sheetControls = useAnimationControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [registered, setRegistered] = useState(false);
  const [closing, setClosing] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (typeof document === 'undefined') return null;

  const isBottomSheet = variant === 'bottom';
  const useBottomSheetMobile = isBottomSheet && isMobile;
  const useBottomSheetDesktop = isBottomSheet && !isMobile;
  const swipeEnabled = swipeToClose ?? isBottomSheet;

  useEffect(() => {
    if (open && useBottomSheetMobile && swipeEnabled) {
      sheetControls.start({ y: 0, transition: { duration: 0.32, ease: EASE } });
    }
  }, [open, useBottomSheetMobile, swipeEnabled, sheetControls]);

  const dragStart = useRef<{ y: number; time: number; lastY: number; lastTime: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const start = dragStart.current;
      if (!start) return;
      const dy = e.clientY - start.y;
      if (dy > 0) {
        sheetControls.start({ y: dy });
        start.lastY = e.clientY;
        start.lastTime = Date.now();
      }
    };
    const onUp = (e: PointerEvent) => {
      const start = dragStart.current;
      dragStart.current = null;
      setDragging(false);
      if (!start) return;
      const dy = e.clientY - start.y;
      const dt = Math.max(1, Date.now() - start.lastTime);
      const velocity = (e.clientY - start.lastY) / dt;
      if (dy > SWIPE_THRESHOLD || (dy > 40 && velocity > SWIPE_VELOCITY / 1000)) {
        onClose();
      } else {
        sheetControls.start({ y: 0, transition: { type: 'spring', damping: 28, stiffness: 320 } });
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, sheetControls, onClose]);

  const handlePanelPointerDown = (e: React.PointerEvent) => {
    if (!useBottomSheetMobile || !swipeEnabled || !e.isPrimary) return;
    if (contentRef.current && contentRef.current.scrollTop > 0) return;
    dragStart.current = { y: e.clientY, time: Date.now(), lastY: e.clientY, lastTime: Date.now() };
    setDragging(true);
  };

  const overlayTransition = { duration: transitionDuration, ease: EASE };

  const panelVariants = (() => {
    if (reduceMotion) {
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    }
    switch (variant) {
      case 'center':
        return {
          initial: { opacity: 0, scale: 0.96, y: 10 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.96, y: 10 },
        };
      case 'bottom':
        return useBottomSheetMobile
          ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
          : {
              initial: { opacity: 0, scale: 0.97, y: 36 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: 0.97, y: 36 },
            };
      case 'left':
        return { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
      case 'right':
        return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
      case 'full':
        return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
    }
  })();

  const panelClasses = cn(
    'relative flex flex-col overflow-hidden bg-card text-foreground shadow-2xl border-border/40',
<<<<<<< HEAD
    variant === 'center' && cn('w-full max-h-[85dvh] rounded-3xl border', SIZE_MAX_W[size]),
    // Mobile bottom sheets (and edge-to-edge drawers/full overlays) span to the
    // screen edges, so pad them clear of the iOS/Android home-indicator safe area.
    // env() resolves to 0 on desktop/non-notch devices, so this is a no-op there.
    useBottomSheetMobile && 'absolute inset-x-0 bottom-0 w-full max-h-[92dvh] rounded-t-3xl border-t pb-[env(safe-area-inset-bottom)]',
    useBottomSheetDesktop && 'absolute left-1/2 top-1/2 w-full h-[min(85dvh,52rem)] rounded-3xl border',
    variant === 'left' && 'absolute inset-y-0 left-0 w-[min(85vw,20rem)] rounded-r-3xl border-r pb-[env(safe-area-inset-bottom)]',
    variant === 'right' && 'absolute inset-y-0 right-0 w-[min(85vw,20rem)] rounded-l-3xl border-l pb-[env(safe-area-inset-bottom)]',
    // Full overlays track the dynamic viewport (dvh) so they never extend behind
    // the browser URL bar / home indicator on mobile.
    variant === 'full' && 'absolute inset-x-0 top-0 h-dvh w-full rounded-none border-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
=======
    variant === 'center' && cn('w-full h-full sm:h-auto max-h-full sm:max-h-[85dvh] rounded-none sm:rounded-3xl border-0 sm:border', SIZE_MAX_W[size]),
    useBottomSheetMobile && 'absolute inset-x-0 bottom-0 w-full max-h-[92dvh] rounded-t-3xl border-t',
    useBottomSheetDesktop && 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[min(85dvh,52rem)] rounded-3xl border',
    variant === 'left' && 'absolute inset-y-0 left-0 w-[min(85vw,20rem)] rounded-r-3xl border-r',
    variant === 'right' && 'absolute inset-y-0 right-0 w-[min(85vw,20rem)] rounded-l-3xl border-l',
    variant === 'full' && 'absolute inset-0 h-full w-full rounded-none border-0',
>>>>>>> 908917fdc5533110f1326c2fcd4d606479dde397
    className
  );

  const handleExitComplete = () => {
    setClosing(false);
    onExitComplete?.();
  };

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open && (
        <motion.div
          key="premium-modal-root"
          className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 overflow-hidden"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Dimming + blur overlay */}
          <motion.div
            className={cn('absolute inset-0 bg-black/45 backdrop-blur-[8px]', overlayClassName)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={panelClasses}
            initial={panelVariants.initial}
            animate={useBottomSheetMobile && swipeEnabled ? sheetControls : panelVariants.animate}
            exit={panelVariants.exit}
            transition={{ duration: transitionDuration, ease: EASE }}
            onPointerDown={handlePanelPointerDown}
            style={useBottomSheetMobile && swipeEnabled && dragging ? { cursor: 'grabbing' } : undefined}
          >
            {useBottomSheetMobile && !bare && (
              <div className="pointer-events-none flex shrink-0 items-center justify-center pt-2.5 pb-0">
                <div className="h-1 w-10 rounded-full bg-foreground/15" />
              </div>
            )}

            {!bare && header !== undefined && (
              <div className="flex shrink-0 items-center gap-2 border-b border-border/40 bg-card/80 px-4 py-3 backdrop-blur-xl">
                {header}
              </div>
            )}

            {!bare && header === undefined && showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {bare ? (
              children
            ) : (
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 scrollbar-none"
              >
                {children}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
