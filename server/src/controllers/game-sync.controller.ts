import { Response } from 'express';
import { AuthRequest } from '../types';
import { gameSyncService } from '../services/game-sync.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';

export class GameSyncController {
  listConnectedAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const accounts = await prisma.gameAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, accounts);
  });

  syncPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { platform } = req.params;
    const { identifier, region } = req.body;

    let result;
    const platUpper = platform.toUpperCase();

    if (platUpper === 'STEAM') {
      result = await gameSyncService.syncSteam(userId, identifier || '76561198012345678');
    } else if (platUpper === 'RIOT' || platUpper === 'VALORANT') {
      result = await gameSyncService.syncRiot(userId, identifier || 'TenZ#NA1', region || 'NA');
    } else if (platUpper === 'FACEIT') {
      result = await gameSyncService.syncFaceit(userId, identifier || 's1mple');
    } else if (platUpper === 'DISCORD') {
      result = await gameSyncService.syncDiscord(userId, identifier || 'GamerZ#0001');
    } else {
      return sendError(res, 400, `Unsupported platform: ${platform}`);
    }

    if (result.success) {
      sendSuccess(res, result.gameAccount, `${platform} account synchronized successfully!`);
    } else {
      sendError(res, 500, result.message || `Failed to sync ${platform}`);
    }
  });

  disconnectPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { platform } = req.params;
    const ok = await gameSyncService.disconnectAccount(userId, platform.toUpperCase());
    if (ok) {
      sendSuccess(res, null, `${platform} disconnected successfully.`);
    } else {
      sendError(res, 500, `Failed to disconnect ${platform}`);
    }
  });
}

export const gameSyncController = new GameSyncController();
