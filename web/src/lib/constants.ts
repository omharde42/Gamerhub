const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

export const API_URL = envApiUrl || 'http://localhost:4000/api';
export const SOCKET_URL = envSocketUrl || 'http://localhost:4000';
export const APP_NAME = 'GamerHub';
export const COPYRIGHT = `© ${new Date().getFullYear()} GamerHub. All rights reserved.`;

export const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
export const GAMES = ['Valorant', 'CS2', 'League of Legends', 'Dota 2', 'Overwatch 2', 'Apex Legends', 'Fortnite', 'Rainbow Six Siege', 'Rocket League', 'Call of Duty', 'PUBG', 'Elden Ring', 'Street Fighter 6', 'Tekken 8', 'Super Smash Bros. Ultimate', 'Minecraft', 'GTA V', 'World of Warcraft', 'Final Fantasy XIV', 'Destiny 2', 'Warframe', 'Dead by Daylight', 'Fall Guys', 'Among Us', 'Rust', 'Escape from Tarkov', 'Halo Infinite', 'Battlefield 2042', 'Counter-Strike 1.6', 'Team Fortress 2'];
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
