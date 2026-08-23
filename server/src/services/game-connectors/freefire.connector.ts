import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

const UNAVAILABLE_MESSAGE = 'This game does not currently support verified account connection. Free Fire has no official server-side player-data API, so GamerZ Hub never fabricates statistics or marks Free Fire accounts as verified.';

/**
 * Free Fire has no official public player-data API. This connector exists so the
 * generic game routes return a clear, honest error instead of inventing stats.
 * It never creates a verified account.
 */
export class FreeFireConnector implements IGameConnector {
  gameKey = 'freefire';

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
    // Allow removing legacy Free Fire records that were stored before the
    // fabrication ban. Never re-verifies.
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'FREE_FIRE' },
    });
    return true;
  }
}
