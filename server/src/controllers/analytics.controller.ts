import { Response } from 'express';
import { AuthRequest } from '../types';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AnalyticsController {
  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await analyticsService.getUserStats(req.user!.userId);
    sendSuccess(res, stats);
  });

  getHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getUserHeatmapData(req.user!.userId);
    sendSuccess(res, data);
  });

  getWeeklyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await analyticsService.getWeeklyProgress(req.user!.userId);
    sendSuccess(res, data);
  });
}

export const analyticsController = new AnalyticsController();
