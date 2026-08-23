/** Deterministic gamer level derived from real match count. */
export function gamerLevel(totalMatches = 0) {
  const m = Math.max(0, Number(totalMatches) || 0);
  const raw = Math.sqrt(m / 2);
  const level = Math.min(99, Math.max(1, Math.floor(raw) + 1));
  const xp = Math.round((raw - Math.floor(raw)) * 100);
  return { level, xp };
}

export function levelTitle(level: number): string {
  if (level >= 80) return 'LEGEND';
  if (level >= 55) return 'GRANDMASTER';
  if (level >= 35) return 'MASTER';
  if (level >= 20) return 'ELITE';
  if (level >= 10) return 'VETERAN';
  if (level >= 5) return 'CONTENDER';
  return 'ROOKIE';
}

export function levelColor(level: number): string {
  if (level >= 80) return '#FBBF24';
  if (level >= 55) return '#C4B5FD';
  if (level >= 35) return '#F472B6';
  if (level >= 20) return '#67E8F9';
  if (level >= 10) return '#34F5C5';
  return '#10B981';
}
