import { IGameConnector } from './base.connector';
import { steamService } from '../steam.service';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

/**
 * Steam connector — verifies a steamID64 against the official Steam Web API.
 * No fabricated persona names, levels, games, playtime or achievements are ever
 * stored. When the API key is missing or the API cannot confirm the account,
 * the connection is rejected.
 */
export class SteamConnector implements IGameConnector {
  gameKey = 'steam';

  async validate(payload: Record<string, any>): Promise<boolean> {
    const steamId = (payload.steamId || '').trim();
    if (!steamId) throw new AppError('Steam ID64 is required', 400);
    // SteamIDs are 17-digit numeric identifiers (e.g. 76561198012345678).
    if (!/^\d{17}$/.test(steamId)) {
      throw new AppError('Steam ID64 must be a 17-digit numeric SteamID (e.g. 76561198012345678).', 400);
    }
    return true;
  }

  async fetchProfile(gameUid: string): Promise<any> {
    const profile = await steamService.getSteamProfileData(gameUid);
    if (!profile) {
      throw new AppError('Steam profile data is currently unavailable. Please try again later.', 502);
    }
    return profile;
  }

  async fetchStats(gameUid: string): Promise<any> {
    return this.fetchProfile(gameUid);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const steamId = payload.steamId.trim();
    const profile = await this.fetchProfile(steamId);

    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: { userId, game: 'STEAM' },
      },
      update: {
        inGameUid: steamId,
        inGameName: profile.username,
        rank: `Level ${profile.level}`,
        level: profile.level,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'STEAM',
        inGameUid: steamId,
        inGameName: profile.username,
        rank: `Level ${profile.level}`,
        level: profile.level,
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

export const steamConnector = new SteamConnector();
