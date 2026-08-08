import { IGameConnector } from './base.connector';
import { clashOfClansService } from '../clashofclans.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class ClashOfClansConnector implements IGameConnector {
  gameKey = 'clashofclans';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.playerTag) throw new AppError('Player Tag is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return clashOfClansService.getPlayerProfile(gameUid);
  }

  async fetchStats(gameUid: string): Promise<any> {
    return clashOfClansService.getPlayerProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const tag = payload.playerTag;
    const stats = await this.fetchProfile(tag);
    const normalizedTag = `#${clashOfClansService.normalizeTag(tag)}`;

    // Check tag lock rules
    const existingAccount = await prisma.gameAccount.findUnique({
      where: {
        userId_game: { userId, game: 'CLASH_OF_CLANS' },
      },
    });

    if (existingAccount) {
      const isSameTag = existingAccount.inGameUid.toUpperCase() === normalizedTag.toUpperCase();
      if (!isSameTag) {
        if (existingAccount.changeCount >= 1) {
          throw new AppError('Player Tag Locked: You have used your one allowed Player Tag change.', 403);
        }
      }
    }

    const nextChangeCount = existingAccount 
      ? (existingAccount.inGameUid.toUpperCase() !== normalizedTag.toUpperCase() ? existingAccount.changeCount + 1 : existingAccount.changeCount) 
      : 0;

    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: {
          userId,
          game: 'CLASH_OF_CLANS',
        },
      },
      update: {
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        changeCount: nextChangeCount,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'CLASH_OF_CLANS',
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        changeCount: 0,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    // Update Profile rank in database
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        rank: `Town Hall ${stats.townHallLevel}`,
      },
    });

    return { gameAccount, stats };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'CLASH_OF_CLANS' },
    });
    return true;
  }
}
