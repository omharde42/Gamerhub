import { Response } from 'express';
import { AuthRequest } from '../types';
import { aiService } from '../services/ai.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class MatchmakingController {
  getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game, limit } = req.query;
    const recommendations = await aiService.getPlayerRecommendations({
      userId: req.user!.userId,
      game: game as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    sendSuccess(res, recommendations);
  });
}

export const matchmakingController = new MatchmakingController();
