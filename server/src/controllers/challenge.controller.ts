import { Response } from 'express';
import { AuthRequest } from '../types';
import { challengeService, ChallengeDirection, ChallengeWinner } from '../services/challenge.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class ChallengeController {
  getGameModes = asyncHandler(async (_req: AuthRequest, res: Response) => {
    sendSuccess(res, challengeService.getGameModes());
  });

  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.createChallenge(req.user!.userId, req.body);
    sendSuccess(res, challenge, 'Challenge sent', 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, direction } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const result = await challengeService.listChallenges(req.user!.userId, {
      status: status as string | undefined,
      direction: (direction as ChallengeDirection) || 'all',
      page,
      limit,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  counts = asyncHandler(async (req: AuthRequest, res: Response) => {
    sendSuccess(res, await challengeService.getCounts(req.user!.userId));
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.getChallenge(req.user!.userId, req.params.id);
    sendSuccess(res, challenge);
  });

  accept = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.acceptChallenge(req.user!.userId, req.params.id);
    sendSuccess(res, challenge, 'Challenge accepted');
  });

  decline = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.declineChallenge(req.user!.userId, req.params.id);
    sendSuccess(res, challenge, 'Challenge declined');
  });

  cancel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.cancelChallenge(req.user!.userId, req.params.id);
    sendSuccess(res, challenge, 'Challenge cancelled');
  });

  complete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const challenge = await challengeService.completeChallenge(
      req.user!.userId,
      req.params.id,
      req.body.winner as ChallengeWinner | undefined
    );
    sendSuccess(res, challenge, 'Challenge completed');
  });

  block = asyncHandler(async (req: AuthRequest, res: Response) => {
    const block = await challengeService.blockUser(req.user!.userId, req.body.targetId);
    sendSuccess(res, block, 'User blocked', 201);
  });

  unblock = asyncHandler(async (req: AuthRequest, res: Response) => {
    await challengeService.unblockUser(req.user!.userId, req.params.targetId);
    sendSuccess(res, null, 'User unblocked');
  });

  listBlocks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const blocks = await challengeService.listBlocks(req.user!.userId);
    sendSuccess(res, blocks);
  });

  report = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await challengeService.reportUser(
      req.user!.userId,
      req.body.targetId,
      req.body.reason,
      req.body.description,
      req.params.id
    );
    sendSuccess(res, report, 'Report submitted', 201);
  });
}

export const challengeController = new ChallengeController();
