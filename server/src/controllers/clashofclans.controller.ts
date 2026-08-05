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

    // 2. Save connected game account in database
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

    // 3. Calculate derived profile metrics from Clash of Clans live stats
    const attackWins = stats.attackWins || 0;
    const defenseWins = stats.defenseWins || 0;
    const totalMatches = Math.max(attackWins + defenseWins, stats.warStars * 2, 50);
    const winRate = Math.min(Math.round((attackWins / Math.max(attackWins + defenseWins, 1)) * 100) || 70, 100);
    const kd = parseFloat((1.2 + (stats.townHallLevel * 0.15)).toFixed(2));
    const accuracy = Math.min(Math.round(50 + (stats.warStars * 0.05)), 95);

    // Update main user profile metrics in database
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        winRate,
        kd,
        accuracy,
        totalMatches,
        rank: `Town Hall ${stats.townHallLevel}`,
      },
    });

    sendSuccess(res, { gameAccount, stats }, 'Clash of Clans account connected successfully!');
  });
}

export const clashOfClansController = new ClashOfClansController();
