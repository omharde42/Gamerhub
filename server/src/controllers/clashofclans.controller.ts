import { Response } from 'express';
import { AuthRequest } from '../types';
import { clashOfClansService } from '../services/clashofclans.service';
import { clashOfClansConnector } from '../services/game-connectors/clashofclans.connector';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class ClashOfClansController {
  /**
   * GET /api/clashofclans/player/:tag
   * Returns live/cached player JSON data from Clash of Clans API
   */
  getPlayer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tag } = req.params;
    const stats = await clashOfClansService.getPlayerProfile(tag);
    sendSuccess(res, stats, 'Clash of Clans player data retrieved successfully');
  });

  /**
   * POST /api/clashofclans/connect
   * Validates player tag, connects account to user profile, and updates DB.
   *
   * Delegates to the shared ClashOfClansConnector so this legacy route follows
   * the exact same rules as /api/game/clashofclans/connect:
   *   - tag is verified against the live Supercell API before accepting it,
   *   - the one-time tag-change lock (changeCount >= 1) is enforced on the
   *     backend, so a client can never bypass it via this route,
   *   - no statistics are invented — only real API values are stored.
   */
  connectAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await clashOfClansConnector.connect(req.user!.userId, req.body);
    sendSuccess(res, result, 'Clash of Clans account connected successfully!');
  });
}

export const clashOfClansController = new ClashOfClansController();
