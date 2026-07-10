import { Response } from 'express';
import { AuthRequest } from '../types';
import { jobService } from '../services/job.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class JobController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const job = await jobService.create(req.body, req.user!.userId);
    sendSuccess(res, job, undefined, 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, type, game, status } = req.query;
    const result = await jobService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      type: type as string,
      game: game as string,
      status: status as string,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  apply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message } = req.body;
    const application = await jobService.apply(req.params.id, req.user!.userId, message);
    sendSuccess(res, application);
  });

  save = asyncHandler(async (req: AuthRequest, res: Response) => {
    await jobService.save(req.user!.userId, req.params.id);
    sendSuccess(res, null, 'Job saved');
  });

  unsave = asyncHandler(async (req: AuthRequest, res: Response) => {
    await jobService.unsave(req.user!.userId, req.params.id);
    sendSuccess(res, null, 'Job unsaved');
  });
}

export const jobController = new JobController();
