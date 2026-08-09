import { Request, Response, NextFunction } from 'express';
import { pubgService } from '../services/pubg.service';
import { pubgConnector } from '../services/game-connectors/pubg.connector';

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
      const name = (req.query.name || req.query.uid) as string;
      const data = await pubgService.getPlayerProfile(name || 'TGLTN', 'steam');
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  connect: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || 'demo-user';
      const { playerName } = req.body;
      const result = await pubgConnector.connect(userId, { playerName });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
