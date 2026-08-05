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
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    // Update Profile top stats
    const attackWins = stats.attackWins || 0;
    const defenseWins = stats.defenseWins || 0;
    const totalMatches = Math.max(attackWins + defenseWins, stats.warStars * 2, 50);
    const winRate = Math.min(Math.round((attackWins / Math.max(attackWins + defenseWins, 1)) * 100) || 70, 100);

    await prisma.profile.updateMany({
      where: { userId },
      data: {
        winRate,
        kd: parseFloat((1.2 + (stats.townHallLevel * 0.15)).toFixed(2)),
        accuracy: Math.min(Math.round(50 + (stats.warStars * 0.05)), 95),
        totalMatches,
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
