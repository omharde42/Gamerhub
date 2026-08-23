import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { pubgService } from '../services/pubg.service';
import { pubgConnector } from '../services/game-connectors/pubg.connector';
import { AppError } from '../utils/errors';

export const pubgController = {
  getPlayer: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { platform, playerName } = req.params;
      const data = await pubgService.getPlayerProfile(playerName as string, (platform as string) || 'steam');
      res.json({
        success: true,
        game: 'PUBG',
        platform: 'Steam',
        player: {
          id: data.id,
          name: data.name,
          shard: data.shard,
          clanId: data.clanId,
          banType: data.banType,
        },
        stats: {
          kills: data.kills,
          deaths: data.deaths,
          wins: data.wins,
          matches: data.matches,
          kdRatio: data.kdRatio,
          winRate: data.winRate,
          accuracy: data.accuracy,
          accuracyNote: data.accuracyNote,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = (req.query.name || req.query.uid) as string | undefined;
      // Never default to a hard-coded player: an empty lookup would otherwise
      // surface another player's stats as if they belonged to the requester.
      if (!name || !name.trim()) {
        throw new AppError('PUBG player name is required. Pass ?name=PlayerName.', 400);
      }
      const data = await pubgService.getPlayerProfile(name, 'steam');
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  connect: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // `connect` is guarded by the `authenticate` middleware — the user id
      // always comes from the verified token, never a client-supplied value.
      const userId = req.user!.userId;
      const { playerName } = req.body;
      const result = await pubgConnector.connect(userId, { playerName });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
