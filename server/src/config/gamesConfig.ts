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
  fields: GameField[];
}

export const GAMES_CONFIG: Record<string, GameConfig> = {
  clashofclans: {
    id: 'clashofclans',
    name: 'Clash of Clans',
    icon: '🏰',
    color: '#EAB308',
    brandColor: '#EAB308',
    fields: [{ name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. #GR8QQRV9J', required: true }],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    icon: '🎯',
    color: '#FF4655',
    brandColor: '#FF4655',
    fields: [
      { name: 'riotId', label: 'Riot ID', placeholder: 'e.g. TenZ#NA1', required: true },
      { name: 'region', label: 'Region', placeholder: 'ap', required: true },
    ],
  },
  steam: {
    id: 'steam',
    name: 'Steam',
    icon: '🎮',
    color: '#38BDF8',
    brandColor: '#171A21',
    fields: [{ name: 'steamId', label: 'Steam ID64', placeholder: 'e.g. 76561198012345678', required: true }],
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire',
    icon: '🔥',
    color: '#F97316',
    brandColor: '#F97316',
    fields: [
      { name: 'uid', label: 'Player UID', placeholder: 'e.g. 123456789', required: true },
      { name: 'region', label: 'Region', placeholder: 'ind', required: true },
    ],
  },
  bgmi: {
    id: 'bgmi',
    name: 'BGMI / PUBG Mobile',
    icon: '🪖',
    color: '#EAB308',
    brandColor: '#F59E0B',
    fields: [{ name: 'uid', label: 'Character ID', placeholder: 'e.g. 5123456789', required: true }],
  },
  clashroyale: {
    id: 'clashroyale',
    name: 'Clash Royale',
    icon: '👑',
    color: '#3B82F6',
    brandColor: '#3B82F6',
    fields: [{ name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. #2PP820CG', required: true }],
  },
  brawlstars: {
    id: 'brawlstars',
    name: 'Brawl Stars',
    icon: '🌟',
    color: '#EC4899',
    brandColor: '#EC4899',
    fields: [{ name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. #90UJLY2', required: true }],
  },
};
