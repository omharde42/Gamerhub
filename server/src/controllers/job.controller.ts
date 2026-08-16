import { Response } from 'express';
import { AuthRequest } from '../types';
import { jobService } from '../services/job.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { JobType, JobStatus } from '@prisma/client';

export class JobController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const job = await jobService.create(req.body, req.user!.userId);
    sendSuccess(res, job, undefined, 201);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const job = await jobService.update(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, job, 'Job updated');
  });

  remove = asyncHandler(async (req: AuthRequest, res: Response) => {
    await jobService.remove(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Job deleted');
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, type, game, status, search, location } = req.query;
    const result = await jobService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      type: type ? (type as JobType) : undefined,
      game: game as string,
      status: status ? (status as JobStatus) : undefined,
      search: search as string,
      location: location as string,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const job = await jobService.getById(req.params.id);
    sendSuccess(res, job);
  });

  listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobs = await jobService.listMine(req.user!.userId);
    sendSuccess(res, jobs);
  });

  apply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, resume } = req.body;
    if (!message && !resume) {
      return sendError(res, 400, 'Please include a message or resume with your application');
    }
    const application = await jobService.apply(req.params.id, req.user!.userId, message, resume);
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
