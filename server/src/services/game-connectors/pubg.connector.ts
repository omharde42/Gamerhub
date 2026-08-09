import { IGameConnector } from './base.connector';
import { pubgService } from '../pubg.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class PubgConnector implements IGameConnector {
  gameKey = 'pubg';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.playerName) throw new AppError('PUBG Player Name is required', 400);
    return true;
  }

  async fetchProfile(playerName: string): Promise<any> {
    return pubgService.getPlayerProfile(playerName, 'steam');
  }

  async fetchStats(playerName: string): Promise<any> {
    return pubgService.getPlayerProfile(playerName, 'steam');
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const name = payload.playerName;
    const stats = await this.fetchProfile(name);

    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: {
          userId,
          game: 'PUBG',
        },
      },
      update: {
        inGameUid: stats.name,
        inGameName: stats.name,
        rank: `K/D ${stats.kdRatio}`,
        kdRatio: parseFloat(stats.kdRatio) || 0,
        winRate: parseFloat(stats.winRate) || 0,
        totalMatches: stats.matches,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'PUBG',
        inGameUid: stats.name,
        inGameName: stats.name,
        rank: `K/D ${stats.kdRatio}`,
        kdRatio: parseFloat(stats.kdRatio) || 0,
        winRate: parseFloat(stats.winRate) || 0,
        totalMatches: stats.matches,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    return { gameAccount, stats };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'PUBG' },
    });
    return true;
  }
}

export const pubgConnector = new PubgConnector();
