'use client';
import { useEffect, useState } from 'react';

export interface CelebrationPayload {
  title: string;
  subtitle?: string;
  /** default 90 pieces */
  pieces?: number;
}

const CELEBRATION_EVENT = 'gamerhub:celebration';

const COLORS = ['#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#22D3EE', '#34D399', '#F472B6'];

/** Fire a full-screen confetti + banner celebration from anywhere. */
export function fireCelebration(title: string, subtitle?: string, pieces?: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CelebrationPayload>(CELEBRATION_EVENT, {
      detail: { title, subtitle, pieces },
    }),
  );
}

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotate: number;
  shape: 'rect' | 'circle';
}

const SHAPES: ConfettiPiece['shape'][] = ['rect', 'circle'];

export function CelebrationHost() {
  const [burst, setBurst] = useState<(CelebrationPayload & { id: number }) | null>(null);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const onCelebration = (e: Event) => {
      const detail = (e as CustomEvent<CelebrationPayload>).detail;
      const count = detail.pieces ?? 90;
      setBurst({ ...detail, id: Date.now() });
      setPieces(
        Array.from({ length: count }, (_, i) => ({
          id: Date.now() + i,
          left: Math.random() * 100,
          size: Math.random() * 8 + 5,
          color: COLORS[i % COLORS.length],
          duration: Math.random() * 1.8 + 1.6,
          delay: Math.random() * 0.45,
          rotate: Math.random() * 720 - 360,
          shape: SHAPES[i % SHAPES.length],
        })),
      );
    };
    window.addEventListener(CELEBRATION_EVENT, onCelebration);
    return () => window.removeEventListener(CELEBRATION_EVENT, onCelebration);
  }, []);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => {
      setBurst(null);
      setPieces([]);
    }, 3000);
    return () => clearTimeout(t);
  }, [burst]);

  if (!burst) return null;

  return (
    <div aria-hidden className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* White/neon flash */}
      <div
        className="celebration-flash absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35), rgba(16,185,129,0.22), transparent 75%)' }}
      />
      {/* Banner */}
      <div className="absolute top-[16vh] left-0 right-0 flex justify-center px-4">
        <div className="celebration-banner text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-emerald-500/50 bg-[#070B14]/95 backdrop-blur-xl shadow-[0_0_60px_rgba(16,185,129,0.45)]">
            <span className="text-2xl">🏆</span>
            <div className="text-left">
              <p className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-400 leading-tight">
                {burst.title}
              </p>
              {burst.subtitle && (
                <p className="text-[11px] text-muted-foreground font-medium">{burst.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Confetti */}
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 1.6,
            borderRadius: p.shape === 'circle' ? '9999px' : '2px',
            background: p.color,
            boxShadow: `0 0 ${p.size * 2.5}px ${p.color}`,
            ['--sway' as any]: `${Math.round((Math.random() - 0.5) * 80)}px`,
            ['--rot' as any]: `${p.rotate}deg`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(0.25, 0.5, 0.5, 1) both`,
          }}
        />
      ))}
    </div>
  );
}