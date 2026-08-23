import { Response } from 'express';
import { AuthRequest } from '../types';
import { teamService } from '../services/team.service';
import prisma from '../config/database';
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

  listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
    const teams = await prisma.team.findMany({
      where: { members: { some: { userId: req.user!.userId } } },
      include: {
        members: {
          include: {
            user: { select: { id: true, profile: { select: { username: true, displayName: true, avatar: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, teams);
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

  myInvites = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invites = await teamService.myInvites(req.user!.userId);
    sendSuccess(res, invites);
  });

  acceptInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await teamService.acceptInvite(req.params.id, req.user!.userId);
    sendSuccess(res, result, 'Joined team successfully');
  });

  declineInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
    await teamService.declineInvite(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'Invite declined');
  });

  apply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message } = req.body;
    const application = await teamService.apply(req.params.id, req.user!.userId, message);
    sendSuccess(res, application, undefined, 201);
  });

  handleApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId, action } = req.body;
    const result = await teamService.handleApplication(req.params.id, applicationId, action, req.user!.userId);
    sendSuccess(res, result);
  });

  kick = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    await teamService.kick(req.params.id, userId, req.user!.userId);
    sendSuccess(res, null, 'Member removed');
  });

  leave = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await teamService.leave(req.params.id, req.user!.userId);
    sendSuccess(res, result);
  });
}

export const teamController = new TeamController();
