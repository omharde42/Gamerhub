import { gamerLevel, levelTitle, levelColor } from '@/lib/gamer-level';

interface LevelChipProps {
  totalMatches?: number | null;
  compact?: boolean;
  showTitle?: boolean;
  className?: string;
}

/** Gamified level chip: "LVL 13 • VETERAN" with a neon XP bar. */
export function LevelChip({ totalMatches, compact = false, showTitle = true, className = '' }: LevelChipProps) {
  const { level, xp } = gamerLevel(totalMatches || 0);
  const title = levelTitle(level);
  const color = levelColor(level);

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className="clip-hud inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-black tracking-wider"
          style={{
            color: color,
            background: `${color}1A`,
            border: `1px solid ${color}55`,
            boxShadow: `0 0 14px -2px ${color}66`,
            textShadow: `0 0 10px ${color}AA`,
          }}
        >
          <span className="animate-pulse">◆</span> LVL {level}
          {showTitle && !compact && (
            <span className="opacity-80">• {title}</span>
          )}
        </span>
      </div>
      <div className="xp-shell w-24" style={{ ['--xp-color' as any]: color }}>
        <div className="xp-fill" style={{ width: `${xp}%`, background: `linear-gradient(90deg, ${color}AA, ${color})` }}>
          <div className="xp-shine" />
        </div>
      </div>
    </div>
  );
}