import { Response } from 'express';
import { AuthRequest } from '../types';
import { gameStatsService } from '../services/game-stats.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class GameStatsController {
  verifyGameAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game, inGameUid, inGameName, region } = req.body;
    if (!game || !inGameUid) {
      return sendError(res, 400, 'Game title and In-Game UID are required.');
    }

    const result = await gameStatsService.verifyAndLinkGameAccount({
      userId: req.user!.userId,
      game,
      inGameUid,
      inGameName,
      region,
    });

    sendSuccess(res, result, result.message || `${game} linked successfully.`);
  });

  getUserGameAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const targetUserId = userId || req.user?.userId;

    if (!targetUserId) {
      return sendSuccess(res, []);
    }

    const accounts = await gameStatsService.getUserGameAccounts(targetUserId);
    sendSuccess(res, accounts);
  });

  unlinkGameAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const result = await gameStatsService.unlinkGameAccount(req.user!.userId, id);
    sendSuccess(res, result, 'Game account unlinked successfully.');
  });
}

export const gameStatsController = new GameStatsController();
