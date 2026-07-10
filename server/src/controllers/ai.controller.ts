import { Response } from 'express';
import { AuthRequest } from '../types';
import { aiService } from '../services/ai.service';
import prisma from '../config/database';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';

export class AIController {
  getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game, limit } = req.query;
    const recommendations = await aiService.getPlayerRecommendations({
      userId: req.user!.userId,
      game: game as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    sendSuccess(res, recommendations);
  });

  getProfileAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const analysis = await aiService.analyzeProfileForOptimization(profile);
    sendSuccess(res, { analysis });
  });

  getMatchAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await analyticsService.getUserStats(req.user!.userId);
    const analysis = await aiService.analyzeMatchPerformance(stats.recentPerformance);
    sendSuccess(res, { stats, analysis });
  });

  getTrainingPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const plan = await aiService.generateTrainingPlan(profile);
    sendSuccess(res, { plan });
  });

  detectToxicity = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = req.body;
    const result = await aiService.detectToxicity(content);
    sendSuccess(res, result);
  });

  chat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, history } = req.body;
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    const response = await aiService.chat(message, history || [], profile);
    sendSuccess(res, { response });
  });

  summarizeNews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { articles } = req.body;
    const summary = await aiService.summarizeNews(articles || []);
    sendSuccess(res, { summary });
  });
}

export const aiController = new AIController();
