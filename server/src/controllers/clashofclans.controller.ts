import { Response } from 'express';
import { AuthRequest } from '../types';
import { clashOfClansService } from '../services/clashofclans.service';
import { clashOfClansConnector } from '../services/game-connectors/clashofclans.connector';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import prisma from '../config/database';

export class ClashOfClansController {
  /**
   * GET /api/clashofclans/player/:tag
   * Returns live/cached player JSON data from Clash of Clans API
   */
  getPlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tag } = req.params;
    const stats = await clashOfClansService.getPlayerProfile(tag);
    sendSuccess(res, stats, 'Clash of Clans player data retrieved successfully');
  });

  /**
   * GET /api/clashofclans/status
   * Returns the durable one-time tag-change lock state for the authenticated
   * user. The lock lives on the User row and survives disconnect/logout, so the
   * frontend can show the correct locked state even with no account connected.
   */
  getStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const [account, user] = await Promise.all([
      prisma.gameAccount.findUnique({
        where: { userId_game: { userId, game: 'CLASH_OF_CLANS' } },
        select: { inGameUid: true, changeCount: true, verified: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { clashTagChangeCount: true, clashTagHistory: true },
      }),
    ]);

    const durableChangeCount = user?.clashTagChangeCount ?? 0;
    sendSuccess(res, {
      connected: Boolean(account),
      inGameUid: account?.inGameUid || null,
      verified: account?.verified ?? false,
      changeCount: Math.max(durableChangeCount, account?.changeCount ?? 0),
      locked: durableChangeCount >= 1,
      tagHistory: Array.isArray(user?.clashTagHistory) ? user!.clashTagHistory : [],
    });
  });

  /**
   * POST /api/clashofclans/connect
   * Validates player tag, connects account to user profile, and updates DB.
   *
   * Delegates to the shared ClashOfClansConnector so this legacy route follows
   * the exact same rules as /api/game/clashofclans/connect:
   *   - tag is verified against the live Supercell API before accepting it,
   *   - the one-time tag-change lock (changeCount >= 1) is enforced on the
   *     backend, so a client can never bypass it via this route,
   *   - no statistics are invented — only real API values are stored.
   */
  connectAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await clashOfClansConnector.connect(req.user!.userId, req.body);
    sendSuccess(res, result, 'Clash of Clans account connected successfully!');
  });
}

export const clashOfClansController = new ClashOfClansController();
