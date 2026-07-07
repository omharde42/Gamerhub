import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { feedService } from '../services/feed.service';
export class FeedController {
  async getFeed(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit } = req.query; const result = await feedService.getFeed(req.user!.userId, page ? parseInt(page as string) : undefined, limit ? parseInt(limit as string) : undefined); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async follow(req: AuthRequest, res: Response, next: NextFunction) { try { await feedService.follow(req.user!.userId, req.params.userId); res.json({ success: true, message: 'Followed' }); } catch (error) { next(error); } }
  async unfollow(req: AuthRequest, res: Response, next: NextFunction) { try { await feedService.unfollow(req.user!.userId, req.params.userId); res.json({ success: true, message: 'Unfollowed' }); } catch (error) { next(error); } }
}
export const feedController = new FeedController();
