export type GameStatus = 'LIVE' | 'COMING_SOON';

export interface GameCatalogItem {
  id: string;
  name: string;
  developer: string;
  platform: string;
  description: string;
  status: GameStatus;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  /** Community games have no official player-stat API — they exist for challenges/community play only. */
  community?: boolean;
}

export const GAMES_CATALOG: GameCatalogItem[] = [
  // ── LIVE GAMES (OFFICIAL BACKEND INTEGRATION) ──────────────────────
  {
    id: 'clash_of_clans',
    name: 'Clash of Clans',
    developer: 'Supercell',
    platform: 'Mobile',
    description: 'Sync Town Hall level, Trophies, War Stars, Clan & Hero levels from Supercell API.',
    status: 'LIVE',
    icon: '🏰',
    color: '#EAB308',
    bgGradient: 'from-amber-950/60 via-yellow-950/40 to-black',
    borderColor: 'border-yellow-500/40',
  },
  {
    id: 'pubg',
    name: 'PUBG',
    developer: 'PUBG Studios',
    platform: 'PC / Steam',
    description: 'Sync Steam PC K/D ratio, Win Rate, Total Kills & Matches from PUBG official API.',
    status: 'LIVE',
    icon: '🪖',
    color: '#F59E0B',
    bgGradient: 'from-amber-950/60 via-orange-950/40 to-black',
    borderColor: 'border-amber-500/40',
  },
  // ── PLANNED / COMING SOON GAMES ────────────────────────────────────
  {
    id: 'valorant',
    name: 'VALORANT',
    developer: 'Riot Games',
    platform: 'PC',
    description: 'Sync Riot ID rank, K/D ratio, Win Rate & competitive match stats from Riot API.',
    status: 'LIVE',
    icon: '🎯',
    color: '#FF4655',
    bgGradient: 'from-red-950/60 via-slate-950/40 to-black',
    borderColor: 'border-red-500/30',
  },
  {
    id: 'league_of_legends',
    name: 'League of Legends',
    developer: 'Riot Games',
    platform: 'PC',
    description: 'Riot Games Summoner rank & match stats integration coming soon.',
    status: 'COMING_SOON',
    icon: '⚔️',
    color: '#38BDF8',
    bgGradient: 'from-sky-950/60 via-slate-950/40 to-black',
    borderColor: 'border-sky-500/30',
  },
  {
    id: 'teamfight_tactics',
    name: 'Teamfight Tactics',
    developer: 'Riot Games',
    platform: 'PC / Mobile',
    description: 'TFT rank & Tactician statistics integration coming soon.',
    status: 'COMING_SOON',
    icon: '🧙‍♂️',
    color: '#A855F7',
    bgGradient: 'from-purple-950/60 via-slate-950/40 to-black',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'brawl_stars',
    name: 'Brawl Stars',
    developer: 'Supercell',
    platform: 'Mobile',
    description: 'Sync trophies, wins & Brawler stats from the official Supercell API.',
    status: 'LIVE',
    icon: '⭐',
    color: '#EAB308',
    bgGradient: 'from-yellow-950/60 via-slate-950/40 to-black',
    borderColor: 'border-yellow-500/40',
  },
  {
    id: 'clash_royale',
    name: 'Clash Royale',
    developer: 'Supercell',
    platform: 'Mobile',
    description: 'Sync trophies, arena, win rate & battle stats from the official Supercell API.',
    status: 'LIVE',
    icon: '👑',
    color: '#3B82F6',
    bgGradient: 'from-blue-950/60 via-slate-950/40 to-black',
    borderColor: 'border-blue-500/40',
  },
  {
    id: 'bgmi',
    name: 'BGMI',
    developer: 'Krafton',
    platform: 'Mobile',
    description: 'Official player-data integration is not currently available in GamerZ Hub.',
    status: 'COMING_SOON',
    icon: '🔫',
    color: '#10B981',
    bgGradient: 'from-emerald-950/60 via-slate-950/40 to-black',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'pubg_mobile',
    name: 'PUBG Mobile',
    developer: 'Level Infinite',
    platform: 'Mobile',
    description: 'Official PUBG Mobile player-data integration coming soon.',
    status: 'COMING_SOON',
    icon: '📱',
    color: '#F97316',
    bgGradient: 'from-orange-950/60 via-slate-950/40 to-black',
    borderColor: 'border-orange-500/30',
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    developer: 'Epic Games',
    platform: 'Multi-platform',
    description: 'Epic Games Fortnite statistics integration coming soon.',
    status: 'COMING_SOON',
    icon: '⛏️',
    color: '#8B5CF6',
    bgGradient: 'from-violet-950/60 via-slate-950/40 to-black',
    borderColor: 'border-violet-500/30',
  },
  // ── COMMUNITY GAMES ──────────────────────────────────────────────
  // No official player-stat API exists for these titles — they are community/
  // challenge games only. GamerZ Hub does not fabricate statistics for them;
  // a future official API/player-identity integration can be added later.
  {
    id: 'smashkarts',
    name: 'Smash Karts',
    developer: 'Smash Karts',
    platform: 'Web / Browser',
    description: 'Community game — no official stats API. Play Smash Karts challenges and tournaments with the GamerZ Hub community.',
    status: 'LIVE',
    community: true,
    icon: '🏎️',
    color: '#38BDF8',
    bgGradient: 'from-sky-950/60 via-slate-950/40 to-black',
    borderColor: 'border-sky-500/40',
  },
];
