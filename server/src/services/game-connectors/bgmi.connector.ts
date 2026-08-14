import { IGameConnector } from './base.connector';
import prisma from '../../config/database';
import { AppError } from '../../utils/errors';

const UNAVAILABLE_MESSAGE =
  'This game does not currently support verified account connection. BGMI has no official server-side player-data API on this integration, so GamerZ Hub never fabricates statistics or creates verified PUBG/BGMI accounts.';

/**
 * BGMI previously fabricated hard-coded stats and stored them under the PUBG
 * game account (a duplicate/alternate record). That path is removed entirely:
 * BGMI is only connectable via the official PUBG PC/Console integration and
 * numeric mobile UIDs are rejected there.
 */
export class BgmiConnector implements IGameConnector {
  gameKey = 'bgmi';

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
    // Allow removing legacy BGMI-fabricated records stored under PUBG.
    // The real PUBG connector rejects numeric UIDs, so any PUBG account with a
    // purely numeric inGameUid on this user must be a legacy BGMI record.
    const legacy = await prisma.gameAccount.findFirst({
      where: { userId, game: 'PUBG' },
    });
    if (legacy && /^\d+$/.test(legacy.inGameUid)) {
      await prisma.gameAccount.deleteMany({
        where: { userId, game: 'PUBG' },
      });
    }
    return true;
  }
}
