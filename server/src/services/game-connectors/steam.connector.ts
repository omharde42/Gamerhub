import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class SteamConnector implements IGameConnector {
  gameKey = 'steam';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.steamId) throw new AppError('Steam ID64 is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return {
      game: 'steam',
      steamId: gameUid,
      personaName: 'GamerZ Pro',
      steamLevel: 42,
      avatarUrl: 'https://avatars.steamstatic.com/fef49e7fe7e1b5628dd8562f306823fe65d0b6a3_full.jpg',
      ownedGamesCount: 184,
      totalPlayTimeHours: 2450,
      recentlyPlayed: [
        { name: 'Counter-Strike 2', playTime2WeeksHours: 34.5, totalPlayTimeHours: 1420, icon: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg' },
        { name: 'Dota 2', playTime2WeeksHours: 18.2, totalPlayTimeHours: 680, icon: 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg' },
        { name: 'Apex Legends', playTime2WeeksHours: 8.0, totalPlayTimeHours: 350, icon: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg' },
      ],
      achievements: [
        { title: 'Global Elite Legend', description: 'Won 500 competitive CS2 matches', game: 'Counter-Strike 2' },
        { title: 'Rampage Ace', description: 'Achieved 5 kills in a single round', game: 'Dota 2' },
      ],
    };
  }

  async fetchStats(gameUid: string): Promise<any> {
    return this.fetchProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const steamId = payload.steamId;
    const profile = await this.fetchProfile(steamId);

    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: { userId, game: 'STEAM' },
      },
      update: {
        inGameUid: steamId,
        inGameName: profile.personaName,
        rank: `Level ${profile.steamLevel}`,
        level: profile.steamLevel,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'STEAM',
        inGameUid: steamId,
        inGameName: profile.personaName,
        rank: `Level ${profile.steamLevel}`,
        level: profile.steamLevel,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    return { gameAccount, profile };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'STEAM' },
    });
    return true;
  }
}
