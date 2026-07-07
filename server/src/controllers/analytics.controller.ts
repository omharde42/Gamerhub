import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { analyticsService } from '../services/analytics.service';
export class AnalyticsController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) { try { const stats = await analyticsService.getUserStats(req.user!.userId); res.json({ success: true, data: stats }); } catch (error) { next(error); } }
  async getHeatmap(req: AuthRequest, res: Response, next: NextFunction) { try { const data = await analyticsService.getUserHeatmapData(req.user!.userId); res.json({ success: true, data }); } catch (error) { next(error); } }
  async getWeeklyProgress(req: AuthRequest, res: Response, next: NextFunction) { try { const data = await analyticsService.getWeeklyProgress(req.user!.userId); res.json({ success: true, data }); } catch (error) { next(error); } }
}
export const analyticsController = new AnalyticsController();
