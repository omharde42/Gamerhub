import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class BgmiConnector implements IGameConnector {
  gameKey = 'bgmi';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.uid) throw new AppError('BGMI Character ID is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    return {
      game: 'bgmi',
      uid: gameUid,
      inGameName: `OP_SQUAD_${gameUid.slice(-4)}`,
      level: 68,
      rankTier: 'Conqueror 6,420 PTS',
      seasonMatches: 310,
      chickenDinners: 128,
      kd: 5.42,
      winRate: 41.3,
      mostKillsInSingleMatch: 24,
      headshotRate: 31.8,
      clan: 'MORTAL_ESPORTS',
    };
  }

  async fetchStats(gameUid: string): Promise<any> {
    return this.fetchProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const uid = payload.uid;
    const profile = await this.fetchProfile(uid);

    const gameAccount = await prisma.gameAccount.upsert({
      where: { userId_game: { userId, game: 'PUBG' } },
      update: {
        inGameUid: uid,
        inGameName: profile.inGameName,
        rank: profile.rankTier,
        level: profile.level,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'PUBG',
        inGameUid: uid,
        inGameName: profile.inGameName,
        rank: profile.rankTier,
        level: profile.level,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    await prisma.profile.updateMany({
      where: { userId },
      data: {
        winRate: Math.round(profile.winRate),
        kd: profile.kd,
        accuracy: Math.round(profile.headshotRate),
        totalMatches: profile.seasonMatches,
        rank: profile.rankTier,
      },
    });

    return { gameAccount, profile };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'PUBG' },
    });
    return true;
  }
}
