import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { aiService } from '../services/ai.service';
import prisma from '../config/database';
import { analyticsService } from '../services/analytics.service';
export class AIController {
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) { try { const { game, limit } = req.query; const recommendations = await aiService.getPlayerRecommendations({ userId: req.user!.userId, game: game as string, limit: limit ? parseInt(limit as string) : undefined }); res.json({ success: true, data: recommendations }); } catch (error) { next(error); } }
  async getProfileAnalysis(req: AuthRequest, res: Response, next: NextFunction) { try { const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } }); if (!profile) { res.status(404).json({ success: false, message: 'Profile not found' }); return; } const analysis = await aiService.analyzeProfileForOptimization(profile); res.json({ success: true, data: { analysis } }); } catch (error) { next(error); } }
  async getMatchAnalysis(req: AuthRequest, res: Response, next: NextFunction) { try { const stats = await analyticsService.getUserStats(req.user!.userId); const analysis = await aiService.analyzeMatchPerformance(stats.recentPerformance); res.json({ success: true, data: { stats, analysis } }); } catch (error) { next(error); } }
  async getTrainingPlan(req: AuthRequest, res: Response, next: NextFunction) { try { const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } }); if (!profile) { res.status(404).json({ success: false, message: 'Profile not found' }); return; } const plan = await aiService.generateTrainingPlan(profile); res.json({ success: true, data: { plan } }); } catch (error) { next(error); } }
  async detectToxicity(req: AuthRequest, res: Response, next: NextFunction) { try { const { content } = req.body; const result = await aiService.detectToxicity(content); res.json({ success: true, data: result }); } catch (error) { next(error); } }
}
export const aiController = new AIController();
