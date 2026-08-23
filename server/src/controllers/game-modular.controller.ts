import { Response } from 'express';
import { AuthRequest } from '../types';
import { gameConnectorRegistry } from '../services/game-connectors';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import prisma from '../config/database';

export class GameModularController {
  /**
   * GET /api/game/:game/profile?uid=xxx&region=yyy
   */
  getGameProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game } = req.params;
    const uid = (req.query.uid as string) || (req.query.playerTag as string) || (req.query.riotId as string) || (req.query.steamId as string);
    const region = req.query.region as string;

    const connector = gameConnectorRegistry.getConnector(game);
    const profile = await connector.fetchProfile(uid, region);

    sendSuccess(res, profile, `${game} profile fetched successfully`);
  });

  /**
   * GET /api/game/:game/stats?uid=xxx
   */
  getGameStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game } = req.params;
    const uid = (req.query.uid as string) || (req.query.playerTag as string) || (req.query.riotId as string);
    const region = req.query.region as string;

    const connector = gameConnectorRegistry.getConnector(game);
    const stats = await connector.fetchStats(uid, region);

    sendSuccess(res, stats, `${game} stats fetched successfully`);
  });

  /**
   * POST /api/game/:game/connect
   */
  connectGame = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game } = req.params;
    const userId = req.user!.userId;

    const connector = gameConnectorRegistry.getConnector(game);
    const result = await connector.connect(userId, req.body);

    sendSuccess(res, result, `${game} connected successfully!`);
  });

  /**
   * POST /api/game/:game/disconnect
   */
  disconnectGame = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { game } = req.params;
    const userId = req.user!.userId;

    const connector = gameConnectorRegistry.getConnector(game);
    await connector.disconnect(userId);

    sendSuccess(res, { success: true }, `${game} disconnected successfully!`);
  });

  /**
   * GET /api/game/user-connections?userId=xxx
   */
  getUserConnections = asyncHandler(async (req: AuthRequest, res: Response) => {
    const targetUserId = (req.query.userId as string) || req.user?.userId;
    if (!targetUserId) {
      return sendSuccess(res, [], 'No user specified');
    }

    const accounts = await prisma.gameAccount.findMany({
      where: { userId: targetUserId },
    });

    sendSuccess(res, accounts, 'User connected games retrieved successfully');
  });
}

export const gameModularController = new GameModularController();
