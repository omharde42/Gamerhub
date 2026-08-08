import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { compareService } from '../services/compare.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../config/database';

export const compareController = {
  getCommonGames: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const friendId = req.query.friendId as string | undefined;
    const games = await compareService.getCommonGames(userId, friendId);
    sendSuccess(res, games, 'Common connected games fetched successfully');
  }),

  getLeaderboard: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { gameId } = req.params;
    const data = await compareService.getFriendsLeaderboard(userId, gameId);
    sendSuccess(res, data, 'Friends leaderboard fetched successfully');
  }),

  getVersus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { gameId, friendId } = req.params;
    const data = await compareService.get1v1Comparison(userId, friendId, gameId);
    sendSuccess(res, data, 'Head-to-head comparison fetched successfully');
  }),

  updatePrivacy: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { allowComparison } = req.body;

    const profile = await prisma.profile.update({
      where: { userId },
      data: { allowComparison: Boolean(allowComparison) },
    });

    sendSuccess(res, profile, 'Comparison privacy settings updated');
  }),
};
