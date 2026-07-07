import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { aiService } from '../services/ai.service';
export class MatchmakingController {
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) { try { const { game, limit } = req.query; const recommendations = await aiService.getPlayerRecommendations({ userId: req.user!.userId, game: game as string, limit: limit ? parseInt(limit as string) : undefined }); res.json({ success: true, data: recommendations }); } catch (error) { next(error); } }
}
export const matchmakingController = new MatchmakingController();
