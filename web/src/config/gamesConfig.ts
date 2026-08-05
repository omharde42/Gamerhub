export interface GameField {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'select';
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  brandColor: string;
  bgGradient: string;
  borderColor: string;
  description: string;
  fields: GameField[];
}

export const GAMES_CONFIG: Record<string, GameConfig> = {
  clashofclans: {
    id: 'clashofclans',
    name: 'Clash of Clans',
    icon: '🏰',
    color: '#EAB308',
    brandColor: '#EAB308',
    bgGradient: 'from-amber-950/60 via-yellow-950/40 to-black',
    borderColor: 'border-yellow-500/40',
    description: 'Sync Town Hall, League, War Stars, Trophies & Clan',
    fields: [
      {
        name: 'playerTag',
        label: 'Player Tag',
        placeholder: 'e.g. #GR8QQRV9J',
        required: true,
      },
    ],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    icon: '🎯',
    color: '#FF4655',
    brandColor: '#FF4655',
    bgGradient: 'from-red-950/60 via-slate-950/40 to-black',
    borderColor: 'border-red-500/40',
    description: 'Sync Radiant/Immortal Rank, K/D, Headshot % & Match History',
    fields: [
      {
        name: 'riotId',
        label: 'Riot ID (Name#Tag)',
        placeholder: 'e.g. TenZ#NA1',
        required: true,
      },
      {
        name: 'region',
        label: 'Region',
        placeholder: 'Select Region',
        type: 'select',
        options: [
          { label: 'Asia Pacific (AP)', value: 'ap' },
          { label: 'North America (NA)', value: 'na' },
          { label: 'Europe (EU)', value: 'eu' },
          { label: 'Korea (KR)', value: 'kr' },
          { label: 'LATAM', value: 'latam' },
          { label: 'Brazil (BR)', value: 'br' },
        ],
        required: true,
      },
    ],
  },
  steam: {
    id: 'steam',
    name: 'Steam',
    icon: '🎮',
    color: '#38BDF8',
    brandColor: '#171A21',
    bgGradient: 'from-sky-950/60 via-slate-950/40 to-black',
    borderColor: 'border-sky-500/40',
    description: 'Sync Steam Level, Games Library, Playtime & CS2 Stats',
    fields: [
      {
        name: 'steamId',
        label: 'Steam ID64 / Profile URL',
        placeholder: 'e.g. 76561198012345678',
        required: true,
      },
    ],
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire',
    icon: '🔥',
    color: '#F97316',
    brandColor: '#F97316',
    bgGradient: 'from-orange-950/60 via-amber-950/40 to-black',
    borderColor: 'border-orange-500/40',
    description: 'Sync Grandmaster Rank, K/D, Win Rate & Booyah Counter',
    fields: [
      {
        name: 'uid',
        label: 'Free Fire Player UID',
        placeholder: 'e.g. 123456789',
        required: true,
      },
      {
        name: 'region',
        label: 'Server Region',
        placeholder: 'Select Server',
        type: 'select',
        options: [
          { label: 'India (IND)', value: 'ind' },
          { label: 'BR / Latam', value: 'latam' },
          { label: 'Southeast Asia (SG)', value: 'sg' },
          { label: 'Europe (EU)', value: 'eu' },
        ],
        required: true,
      },
    ],
  },
  bgmi: {
    id: 'bgmi',
    name: 'BGMI / PUBG Mobile',
    icon: '🪖',
    color: '#EAB308',
    brandColor: '#F59E0B',
    bgGradient: 'from-[#1A1408] via-zinc-950 to-black',
    borderColor: 'border-amber-500/40',
    description: 'Sync Conqueror Tier, K/D Ratio, Chicken Dinners & Accuracy',
    fields: [
      {
        name: 'uid',
        label: 'BGMI Character ID',
        placeholder: 'e.g. 5123456789',
        required: true,
      },
    ],
  },
  clashroyale: {
    id: 'clashroyale',
    name: 'Clash Royale',
    icon: '👑',
    color: '#3B82F6',
    brandColor: '#3B82F6',
    bgGradient: 'from-blue-950/60 via-slate-950/40 to-black',
    borderColor: 'border-blue-500/40',
    description: 'Sync King Level, Trophies, Favorite Deck & Win Rate',
    fields: [
      {
        name: 'playerTag',
        label: 'Player Tag',
        placeholder: 'e.g. #2PP820CG',
        required: true,
      },
    ],
  },
  brawlstars: {
    id: 'brawlstars',
    name: 'Brawl Stars',
    icon: '🌟',
    color: '#EC4899',
    brandColor: '#EC4899',
    bgGradient: 'from-pink-950/60 via-slate-950/40 to-black',
    borderColor: 'border-pink-500/40',
    description: 'Sync Trophy Count, Highest Trophies, Club & Brawlers',
    fields: [
      {
        name: 'playerTag',
        label: 'Player Tag',
        placeholder: 'e.g. #90UJLY2',
        required: true,
      },
    ],
  },
};
