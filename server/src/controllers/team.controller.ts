import { Response } from 'express';
import { AuthRequest } from '../types';
import { teamService } from '../services/team.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class TeamController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await teamService.create(req.body, req.user!.userId);
    sendSuccess(res, team, undefined, 201);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await teamService.getById(req.params.id);
    sendSuccess(res, team);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, region, rank } = req.query;
    const result = await teamService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      region: region as string,
      rank: rank as string,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await teamService.update(req.params.id, req.body, req.user!.userId);
    sendSuccess(res, team);
  });

  invite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    const invite = await teamService.invite(req.params.id, userId, req.user!.userId);
    sendSuccess(res, invite);
  });

  acceptInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
    await teamService.acceptInvite(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Joined team');
  });

  apply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message } = req.body;
    const application = await teamService.apply(req.params.id, req.user!.userId, message);
    sendSuccess(res, application, undefined, 201);
  });

  kick = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    await teamService.kick(req.params.id, userId, req.user!.userId);
    sendSuccess(res, null, 'Member removed');
  });
}

export const teamController = new TeamController();
