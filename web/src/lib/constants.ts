import { Capacitor } from '@capacitor/core';

const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

// On native platforms (Capacitor Android/iOS), local loopback 'localhost' is unreachable.
// Fallback to the production backend URLs if the configured URLs point to localhost.
const isNative = typeof window !== 'undefined' && Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform();

export const API_URL = isNative && envApiUrl?.includes('localhost')
  ? 'https://gamerhub-api-6lga.onrender.com/api'
  : (envApiUrl || 'https://gamerhub-api-6lga.onrender.com/api');

export const SOCKET_URL = isNative && envSocketUrl?.includes('localhost')
  ? 'https://gamerhub-api-6lga.onrender.com'
  : (envSocketUrl || 'https://gamerhub-api-6lga.onrender.com');
export const APP_NAME = 'GamerZ Hub';
export const COPYRIGHT = `© ${new Date().getFullYear()} GamerZ Hub. All rights reserved.`;

export const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
export const GAMES = [
  'Valorant',
  'CS2',
  'League of Legends',
  'Dota 2',
  'FACEIT Esports',
  'PUBG / BGMI',
  'Free Fire',
  'Apex Legends',
  'Fortnite',
  'Overwatch 2',
  'Rocket League',
  'Rainbow Six Siege',
  'Call of Duty / Warzone',
  'Call of Duty Mobile',
  'Clash Royale',
  'Clash of Clans',
  'Brawl Stars',
  'Teamfight Tactics',
];
export const GAMES_BY_PLATFORM: Record<string, { games: string[]; icon: string }> = {
  'Riot Games': { games: ['Valorant', 'League of Legends', 'Teamfight Tactics', 'Legends of Runeterra'], icon: 'Swords' },
  'Steam': { games: ['CS2', 'Dota 2', 'PUBG', 'Rust', 'Escape from Tarkov', 'Team Fortress 2', 'Dead by Daylight', 'Warframe', 'Destiny 2'], icon: 'Steam' },
  'Blizzard': { games: ['Overwatch 2', 'World of Warcraft', 'Diablo IV'], icon: 'Gamepad2' },
  'Mobile': { games: ['Free Fire', 'BGMI', 'PUBG Mobile', 'Call of Duty Mobile', 'Ludo King'], icon: 'Smartphone' },
  'Battle Royale': { games: ['Fortnite', 'Apex Legends', 'PUBG'], icon: 'Crosshair' },
  'Other': { games: ['Rainbow Six Siege', 'Rocket League', 'Minecraft', 'Roblox', 'GTA V', 'Elden Ring', 'Street Fighter 6', 'Tekken 8', 'Super Smash Bros. Ultimate', 'Fall Guys', 'Among Us', 'Halo Infinite', 'Battlefield 2042', 'Chess'], icon: 'Gamepad2' },
};
export const ROLES = ['Entry Fragger', 'Support', 'AWPer', 'IGL', 'Lurker', 'Flex', 'Carry', 'Offlane', 'Hard Support', 'Mid Laner', 'Jungler', 'Top Laner', 'ADC', 'Support'];
export const PLAY_STYLES = ['Aggressive', 'Passive', 'Balanced', 'Strategic', 'Technical'];
export const COMMUNICATION_STYLES = ['Shotcaller', 'Supportive', 'Analytical', 'Motivational', 'Quiet'];
export const REGIONS = ['NA', 'EU', 'Asia', 'SEA', 'OCE', 'SA', 'ME'];
export const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'];
