/** Canonical challenge game keys supported by the backend. */
export type ChallengeGameKey = 'clashofclans' | 'pubg' | 'smashkarts';

export const CHALLENGE_GAME_KEYS: ChallengeGameKey[] = ['clashofclans', 'pubg', 'smashkarts'];

/** Games that require a connected, verified account (community games do not). */
export const CONNECTION_REQUIRED_GAMES: ChallengeGameKey[] = ['clashofclans', 'pubg'];

/** Map any game identifier (GameAccount.game, catalog id, etc.) to a canonical challenge game. */
export function normalizeGameKey(game: string): ChallengeGameKey | null {
  const g = (game || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  // Exact-ish matching: 'clash_of_clans' / 'Clash of Clans' / 'CLASHOFCLANS' / 'coc',
  // but NOT 'clashroyale' or other Clash-named titles.
  if (g.includes('clashofclans') || g === 'coc') return 'clashofclans';
  // 'PUBG' / 'PUBG (PC / Steam)' count; 'PUBG Mobile' / 'BGMI' do not.
  if (g.includes('pubg') && !g.includes('mobile') && !g.includes('bgmi')) return 'pubg';
  // Smash Karts is a community game — no official player-data API exists, so it is
  // matched by name only and treated as a challenge/community title.
  if (g.includes('smashkarts') || g.includes('smashkart')) return 'smashkarts';
  return null;
}

export const CHALLENGE_GAME_META: Record<ChallengeGameKey, { name: string; icon: string; color: string; community?: boolean }> = {
  clashofclans: { name: 'Clash of Clans', icon: '🏰', color: '#EAB308' },
  pubg: { name: 'PUBG (PC / Console)', icon: '🪖', color: '#F59E0B' },
  smashkarts: { name: 'Smash Karts', icon: '🏎️', color: '#38BDF8', community: true },
};

export function gameIcon(gameKey: string): string {
  return CHALLENGE_GAME_META[gameKey as ChallengeGameKey]?.icon || '🎮';
}

export function gameLabel(gameKey: string): string {
  return CHALLENGE_GAME_META[gameKey as ChallengeGameKey]?.name || gameKey;
}
