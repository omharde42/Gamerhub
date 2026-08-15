import { IGameConnector } from './base.connector';
import { brawlStarsService } from '../brawlstars.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class BrawlStarsConnector implements IGameConnector {
  gameKey = 'brawlstars';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.playerTag) throw new AppError('Player Tag is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return brawlStarsService.getPlayerProfile(gameUid);
  }

  async fetchStats(gameUid: string): Promise<any> {
    return brawlStarsService.getPlayerProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const tag = payload.playerTag;
    const stats = await this.fetchProfile(tag);
    const normalizedTag = `#${brawlStarsService.normalizeTag(tag)}`;

    const existingAccount = await prisma.gameAccount.findUnique({
      where: { userId_game: { userId, game: 'BRAWL_STARS' } },
    });

    if (existingAccount) {
      const isSameTag = existingAccount.inGameUid.toUpperCase() === normalizedTag.toUpperCase();
      if (!isSameTag && existingAccount.changeCount >= 1) {
        throw new AppError('Player Tag Locked: You have used your one allowed Player Tag change.', 403);
      }
    }

    const nextChangeCount = existingAccount
      ? existingAccount.inGameUid.toUpperCase() !== normalizedTag.toUpperCase() ? existingAccount.changeCount + 1 : existingAccount.changeCount
      : 0;

    const gameAccount = await prisma.gameAccount.upsert({
      where: { userId_game: { userId, game: 'BRAWL_STARS' } },
      update: {
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: 'Trophies ' + stats.trophies,
        level: Math.floor(stats.totalXP / 100),
        kdRatio: null,
        winRate: stats.battleCount > 0 ? Math.round(((stats.soloVictories + stats.duoVictories + stats.teamVictories) / stats.battleCount) * 100) : 0,
        totalMatches: stats.battleCount,
        changeCount: nextChangeCount,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'BRAWL_STARS',
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: 'Trophies ' + stats.trophies,
        level: Math.floor(stats.totalXP / 100),
        kdRatio: null,
        winRate: stats.battleCount > 0 ? Math.round(((stats.soloVictories + stats.duoVictories + stats.teamVictories) / stats.battleCount) * 100) : 0,
        totalMatches: stats.battleCount,
        changeCount: 0,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    await prisma.profile.updateMany({
      where: { userId },
      data: {
        rank: 'Trophies ' + stats.trophies,
        totalMatches: stats.battleCount,
      },
    });

    return { gameAccount, stats };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({ where: { userId, game: 'BRAWL_STARS' } });
    return true;
  }
}