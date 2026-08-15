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

    // The PUBG API reports 'N/A' when a player has no ranked matches yet.
    // Persist real values only — never coerce 'N/A' into 0 (that would
    // fabricate statistics). Nullable DB columns keep the account honest.
    const kd = parseFloat(stats.kdRatio);
    const wr = parseFloat(stats.winRate);
    const hasStats = stats.matches > 0 && Number.isFinite(kd);

    // Never store a "verified" account with zero/unavailable statistics: if
    // the player has no lifetime stats yet (or the stats request failed), the
    // connection is rejected with a clear message instead of saving 0s.
    if (!hasStats) {
      throw new AppError(
        'PUBG lifetime statistics are currently unavailable for this player. The account was not connected — play ranked matches and try again later.',
        422
      );
    }

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
        rank: hasStats ? `K/D ${stats.kdRatio}` : null,
        kdRatio: Number.isFinite(kd) ? kd : null,
        winRate: Number.isFinite(wr) ? wr : null,
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
        rank: hasStats ? `K/D ${stats.kdRatio}` : null,
        kdRatio: Number.isFinite(kd) ? kd : null,
        winRate: Number.isFinite(wr) ? wr : null,
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
