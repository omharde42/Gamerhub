const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

export const API_URL = envApiUrl || 'https://gamerhub-api-6lga.onrender.com/api';
export const SOCKET_URL = envSocketUrl || 'https://gamerhub-api-6lga.onrender.com';
export const APP_NAME = 'GamerZ Hub';
export const COPYRIGHT = `© ${new Date().getFullYear()} GamerZ Hub. All rights reserved.`;

export const RANK_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
export const GAMES = [
  'Valorant', 'CS2', 'League of Legends', 'Dota 2', 'Overwatch 2', 'Apex Legends',
  'Fortnite', 'Rainbow Six Siege', 'Rocket League', 'Call of Duty', 'PUBG', 'PUBG Mobile',
  'Elden Ring', 'Street Fighter 6', 'Tekken 8', 'Super Smash Bros. Ultimate', 'Minecraft',
  'GTA V', 'GTA Online', 'World of Warcraft', 'Final Fantasy XIV', 'Destiny 2', 'Warframe',
  'Dead by Daylight', 'Fall Guys', 'Among Us', 'Rust', 'Escape from Tarkov', 'Halo Infinite',
  'Battlefield 2042', 'Counter-Strike 1.6', 'Team Fortress 2', 'Marvel Rivals',
  'Free Fire', 'BGMI', 'Call of Duty Mobile', 'Call of Duty Warzone', 'Marvel Snap',
  'Roblox', 'Chess.com', 'StarCraft II', 'Age of Empires IV', 'FIFA 25', 'FC 25',
  'NBA 2K25', 'Madden NFL 25', 'Gran Turismo 7', 'Forza Motorsport', 'Forza Horizon 5',
  'Helldivers 2', 'Palworld', 'Enshrouded', 'Nightingale', 'Last Epoch', 'Skull and Bones',
  'Suicide Squad', 'Prince of Persia', 'Tekken 8', 'Street Fighter 6', 'Guilty Gear Strive',
  'Dragon Ball Sparking Zero', 'Black Myth Wukong', 'Star Wars Outlaws', 'Assassin Creed Shadows',
  'Path of Exile 2', 'Hades II', 'Silent Hill 2', 'Metal Gear Solid Delta',
  'Phasmophobia', 'Lethal Company', 'Content Warning', 'Palia', 'Wayfinder',
  'The Finals', 'XDefiant', 'Splitgate', 'Multiversus', 'Omega Strikers',
  'Hunt Showdown', 'Hell Let Loose', 'Squad', 'Arma 3', 'DayZ',
  'Genshin Impact', 'Honkai Star Rail', 'Zenless Zone Zero', 'Wuthering Waves', 'War Thunder',
  'World of Tanks', 'World of Warships', 'RuneScape', 'Old School RuneScape', 'Albion Online',
  'Evil Dead The Game', 'Texas Chainsaw Massacre', 'Killer Klowns from Outer Space', 'The Outlast Trials'
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
