import { Response } from 'express';
import { AuthRequest } from '../types';
import { feedService } from '../services/feed.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class FeedController {
  getFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit } = req.query;
    const result = await feedService.getFeed(
      req.user!.userId,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
    );
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  follow = asyncHandler(async (req: AuthRequest, res: Response) => {
    await feedService.follow(req.user!.userId, req.params.userId);
    sendSuccess(res, null, 'Followed');
  });

  unfollow = asyncHandler(async (req: AuthRequest, res: Response) => {
    await feedService.unfollow(req.user!.userId, req.params.userId);
    sendSuccess(res, null, 'Unfollowed');
  });

  getFollowing = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await feedService.getFollowing(req.user!.userId);
    sendSuccess(res, data);
  });

  getFollowers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await feedService.getFollowers(req.user!.userId);
    sendSuccess(res, data);
  });
}

export const feedController = new FeedController();
