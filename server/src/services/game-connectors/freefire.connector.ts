import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

export class FreeFireConnector implements IGameConnector {
  gameKey = 'freefire';

  async validate(payload: Record<string, any>): Promise<boolean> {
    if (!payload.uid) throw new AppError('Free Fire Player UID is required', 400);
    return true;
  }

  async fetchProfile(gameUid: string, region = 'ind'): Promise<any> {
    return {
      game: 'freefire',
      uid: gameUid,
      nickname: `FF_Legend_${gameUid.slice(-4)}`,
      level: 72,
      exp: 184500,
      likes: 12400,
      rank: 'Grandmaster II',
      region: region.toUpperCase(),
      brRank: 'Grandmaster 4,250 PTS',
      csRank: 'Heroic 52 Stars',
      booyahCount: 420,
      kd: 3.85,
      winRate: 38.4,
      headshotRate: 64.8,
      guild: { name: 'V_BADGE_ELITE', level: 6, role: 'Officer' },
    };
  }

  async fetchStats(gameUid: string, region = 'ind'): Promise<any> {
    return this.fetchProfile(gameUid, region);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const uid = payload.uid;
    const region = payload.region || 'ind';
    const profile = await this.fetchProfile(uid, region);

    const gameAccount = await prisma.gameAccount.upsert({
      where: { userId_game: { userId, game: 'FREE_FIRE' } },
      update: {
        inGameUid: uid,
        inGameName: profile.nickname,
        rank: profile.rank,
        level: profile.level,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'FREE_FIRE',
        inGameUid: uid,
        inGameName: profile.nickname,
        rank: profile.rank,
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
        totalMatches: profile.booyahCount * 2.5,
        rank: profile.rank,
      },
    });

    return { gameAccount, profile };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'FREE_FIRE' },
    });
    return true;
  }
}
