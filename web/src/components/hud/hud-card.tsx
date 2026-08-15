import { ReactNode, CSSProperties } from 'react';

interface HudCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'none';
  scanlines?: boolean;
  corners?: boolean;
}

const GLOWS: Record<string, string> = {
  emerald: 'shadow-[0_0_24px_-6px_rgba(16,185,129,0.45)]',
  cyan: 'shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)]',
  purple: 'shadow-[0_0_24px_-6px_rgba(139,92,246,0.45)]',
  amber: 'shadow-[0_0_24px_-6px_rgba(245,158,11,0.45)]',
  none: '',
};

const CORNERS: Record<string, string> = {
  emerald: '#10B981',
  cyan: '#22D3EE',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  none: '#10B981',
};

/** Futuristic HUD panel: corner brackets, optional scanlines and neon glow. */
export function HudCard({ children, className = '', glow = 'emerald', scanlines = false, corners = true }: HudCardProps) {
  const color = CORNERS[glow];
  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden ${GLOWS[glow]} ${className}`}
      style={{ '--hud-c': color } as CSSProperties}
    >
      {corners && <span className="hud-corners absolute inset-0 pointer-events-none z-10" />}
      {scanlines && <span className="scanlines absolute inset-0 pointer-events-none z-10" />}
      <div className="relative z-[2] h-full">{children}</div>
    </div>
  );
}