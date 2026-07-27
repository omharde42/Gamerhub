import { Response } from 'express';
import { AuthRequest } from '../types';
import { steamService } from '../services/steam.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import prisma from '../config/database';

export class SteamController {
  getSteamProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const targetUserId = userId || req.user?.userId;

    if (!targetUserId) {
      return sendSuccess(res, null, 'No user specified');
    }

    const profileData = await steamService.getUserSteamProfile(targetUserId);
    sendSuccess(res, profileData);
  });

  getSteamProfileBySteamId = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { steamId } = req.params;
    const profileData = await steamService.getSteamProfileData(steamId);
    sendSuccess(res, profileData);
  });

  disconnectSteam = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        steamId: null,
        steamUsername: null,
        steamAvatar: null,
        steamProfileUrl: null,
        steamLevel: null,
        steamConnectedAt: null,
      },
    });

    await prisma.account.deleteMany({
      where: {
        userId: req.user!.userId,
        provider: 'STEAM',
      },
    });

    sendSuccess(res, null, 'Steam account unlinked successfully');
  });
}

export const steamController = new SteamController();
