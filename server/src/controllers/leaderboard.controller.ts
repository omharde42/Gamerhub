import { Response } from 'express';
import { AuthRequest } from '../types';
import { leaderboardService } from '../services/leaderboard.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class LeaderboardController {
  getGames = asyncHandler(async (_req: AuthRequest, res: Response) => {
    sendSuccess(res, leaderboardService.getGames());
  });

  getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const result = await leaderboardService.getLeaderboard(game, {
      page: Number.isFinite(page) ? page : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      userId: req.user?.userId,
    });
    sendSuccess(res, result);
  });
}

export const leaderboardController = new LeaderboardController();
