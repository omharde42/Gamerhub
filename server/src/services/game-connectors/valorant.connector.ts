import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

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

  async validate(_payload: Record<string, any>): Promise<boolean> {
    throw new AppError(UNAVAILABLE_MESSAGE, 400);
  }

  async fetchProfile(): Promise<any> {
    throw new AppError(UNAVAILABLE_MESSAGE, 400);
  }

  async fetchStats(): Promise<any> {
    throw new AppError(UNAVAILABLE_MESSAGE, 400);
  }

  async connect(_userId: string, _payload: Record<string, any>): Promise<any> {
    throw new AppError(UNAVAILABLE_MESSAGE, 400);
  }

  async disconnect(userId: string): Promise<boolean> {
    // Allow removing legacy Valorant records. Never re-verifies.
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'VALORANT' },
    });
    return true;
  }
}
