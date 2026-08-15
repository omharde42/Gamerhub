import { Response } from 'express';
import { AuthRequest } from '../types';
import { gameSyncService } from '../services/game-sync.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

const UNSUPPORTED_MESSAGE =
  'This game does not currently support verified account connection. GamerZ Hub only verifies Clash of Clans, PUBG PC/Console and Steam accounts through their official APIs.';

export class GameSyncController {
  listConnectedAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const accounts = await prisma.gameAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, accounts);
  });

  /**
   * POST /api/game-sync/sync/:platform
   *
   * Only STEAM is supported, and only through the official Steam Web API with a
   * real steamID64. All other platforms return a clear "verification
   * unavailable" error — no identifiers are ever defaulted and no statistics
   * are fabricated.
   */
  syncPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { platform } = req.params;
    const { identifier } = req.body;

    const platUpper = (platform || '').toUpperCase();

    if (platUpper === 'STEAM') {
      if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
        return sendError(res, 400, 'A Steam ID64 is required to sync a Steam account.');
      }
      const result = await gameSyncService.syncSteam(userId, identifier.trim());
      return sendSuccess(res, result.gameAccount, 'Steam account synchronized with real API data.');
    }

    throw new AppError(UNSUPPORTED_MESSAGE, 400);
  });

  disconnectPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { platform } = req.params;
    const ok = await gameSyncService.disconnectAccount(userId, platform.toUpperCase());
    if (ok) {
      sendSuccess(res, null, `${platform} disconnected successfully.`);
    } else {
      sendError(res, 500, `Failed to disconnect ${platform}`);
    }
  });
}

export const gameSyncController = new GameSyncController();
