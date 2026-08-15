import { IGameConnector } from './base.connector';
import { clashRoyaleService } from '../clashroyale.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class ClashRoyaleConnector implements IGameConnector {
  gameKey = 'clashroyale';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.playerTag) throw new AppError('Player Tag is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return clashRoyaleService.getPlayerProfile(gameUid);
  }

  async fetchStats(gameUid: string): Promise<any> {
    return clashRoyaleService.getPlayerProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const tag = payload.playerTag;
    const stats = await this.fetchProfile(tag);
    const normalizedTag = `#${clashRoyaleService.normalizeTag(tag)}`;

    const existingAccount = await prisma.gameAccount.findUnique({
      where: { userId_game: { userId, game: 'CLASH_ROYALE' } },
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
      where: { userId_game: { userId, game: 'CLASH_ROYALE' } },
      update: {
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: stats.arena?.name || 'Unranked',
        level: stats.expLevel,
        kdRatio: stats.losses > 0 ? Math.round((stats.wins / stats.losses) * 100) / 100 : stats.wins,
        winRate: stats.battleCount > 0 ? Math.round((stats.wins / stats.battleCount) * 100) : 0,
        totalMatches: stats.battleCount,
        changeCount: nextChangeCount,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'CLASH_ROYALE',
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: stats.arena?.name || 'Unranked',
        level: stats.expLevel,
        kdRatio: stats.losses > 0 ? Math.round((stats.wins / stats.losses) * 100) / 100 : stats.wins,
        winRate: stats.battleCount > 0 ? Math.round((stats.wins / stats.battleCount) * 100) : 0,
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
        rank: stats.arena?.name || 'Unranked',
        totalMatches: stats.battleCount,
        wins: stats.wins,
        losses: stats.losses,
      },
    });

    return { gameAccount, stats };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({ where: { userId, game: 'CLASH_ROYALE' } });
    return true;
  }
}