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

  async connect(_userId: string, payload: Record<string, any>): Promise<any> {
    // validate() always throws for BGMI — BGMI is never connectable.
    await this.validate(payload);
    return { connected: false };
  }

  async disconnect(userId: string): Promise<boolean> {
    await prisma.gameAccount.deleteMany({
      where: { userId, game: 'BGMI' },
    });
    return true;
  }
}
