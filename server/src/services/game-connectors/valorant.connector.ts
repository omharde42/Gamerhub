import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';
import { riotService } from '../riot.service';

const UNAVAILABLE_MESSAGE =
  'This game does not currently support verified account connection. Valorant verification requires an official Riot Games OAuth/API integration, which is not available yet — GamerZ Hub never fabricates ranks or statistics.';

/**
 * Valorant has no official public player-data API wired up in GamerZ Hub.
 * Third-party community APIs are not used because they cannot prove account
 * ownership and are not an official source. This connector exists so the
 * generic game routes return a clear, honest error.
 */
export class ValorantConnector implements IGameConnector {
  gameKey = 'valorant';

  async validate(payload: Record<string, any>): Promise<boolean> {
    const riotId = payload.riotId || payload.inGameUid;
    if (!riotId) throw new AppError('Riot ID (Name#Tag) is required', 400);
    riotService.parseRiotId(riotId);
    return true;
  }

  async fetchProfile(gameUid: string, region = 'ap'): Promise<any> {
    return riotService.getValorantProfile(gameUid, region);
  }

  async fetchStats(): Promise<any> {
    throw new AppError(UNAVAILABLE_MESSAGE, 400);
  }

  async connect(userId: string, payload: Record<string, any>): Promise<any> {
    await this.validate(payload);
    const riotId = payload.riotId || payload.inGameUid;
    const region = payload.region || 'ap';

    // Fetch verified backend Riot API data
    const profile = await this.fetchProfile(riotId, region);

    // Save GameAccount in DB
    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: { userId, game: 'VALORANT' },
      },
      update: {
        inGameUid: profile.riotId,
        inGameName: profile.name,
        rank: profile.rank || 'Unranked',
        level: profile.level || null,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'VALORANT',
        inGameUid: profile.riotId,
        inGameName: profile.name,
        rank: profile.rank || 'Unranked',
        level: profile.level || null,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    // Sync ConnectedGame for Passport integration
    const userProfile = await prisma.profile.findUnique({ where: { userId } });
    if (userProfile) {
      const existingConnectedGame = await prisma.connectedGame.findFirst({
        where: { profileId: userProfile.id, gameName: 'Valorant' },
      });

      if (existingConnectedGame) {
        await prisma.connectedGame.update({
          where: { id: existingConnectedGame.id },
          data: {
            publisher: 'Riot Games',
            playerId: profile.name,
            uid: profile.riotId,
            rank: profile.rank || 'Unranked',
            kdRatio: profile.kd,
            winRate: profile.winRate,
            accuracy: profile.headshotPercentage,
            matchesPlayed: profile.matchesPlayed || 0,
            dataSource: 'API',
          },
        });
      } else {
        await prisma.connectedGame.create({
          data: {
            profileId: userProfile.id,
            gameName: 'Valorant',
            publisher: 'Riot Games',
            playerId: profile.name,
            uid: profile.riotId,
            rank: profile.rank || 'Unranked',
            kdRatio: profile.kd,
            winRate: profile.winRate,
            accuracy: profile.headshotPercentage,
            matchesPlayed: profile.matchesPlayed || 0,
            dataSource: 'API',
          },
        });
      }
    }

    // Update main user profile metrics if real statistics exist
    if (!profile.statsUnavailable && profile.winRate !== null) {
      await prisma.profile.updateMany({
        where: { userId },
        data: {
          winRate: Math.round(profile.winRate),
          kd: profile.kd || undefined,
          accuracy: profile.headshotPercentage ? Math.round(profile.headshotPercentage) : undefined,
          rank: profile.rank || undefined,
        },
      });
    }

    return { gameAccount, profile };
  }

  async disconnect(userId: string): Promise<boolean> {
    // Allow removing legacy Valorant records. Never re-verifies.
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'VALORANT' },
    });
    return true;
  }
}

export const valorantConnector = new ValorantConnector();
