import { Response } from 'express';
import { AuthRequest } from '../types';
import { clashOfClansService } from '../services/clashofclans.service';
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
   * POST /api/clashofclans/connect
   * Validates player tag, connects account to user profile, and updates DB
   */
  connectAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { playerTag } = req.body;
    const userId = req.user!.userId;

    // 1. Fetch live data to verify tag validity
    const stats = await clashOfClansService.getPlayerProfile(playerTag);
    const normalizedTag = `#${clashOfClansService.normalizeTag(playerTag)}`;

    // 2. Save connected account in database
    const gameAccount = await prisma.gameAccount.upsert({
      where: {
        userId_game: {
          userId,
          game: 'CLASH_OF_CLANS',
        },
      },
      update: {
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
      create: {
        userId,
        game: 'CLASH_OF_CLANS',
        inGameUid: normalizedTag,
        inGameName: stats.name,
        rank: `Town Hall ${stats.townHallLevel}`,
        level: stats.expLevel,
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      },
    });

    sendSuccess(res, { gameAccount, stats }, 'Clash of Clans account connected successfully!');
  });
}

export const clashOfClansController = new ClashOfClansController();
