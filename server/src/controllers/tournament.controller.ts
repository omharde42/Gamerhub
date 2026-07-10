import { Response } from 'express';
import { AuthRequest } from '../types';
import { tournamentService } from '../services/tournament.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class TournamentController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await tournamentService.create(req.body, req.user!.userId);
    sendSuccess(res, tournament, undefined, 201);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tournament = await tournamentService.getById(req.params.id);
    sendSuccess(res, tournament);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status, game } = req.query;
    const result = await tournamentService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      game: game as string,
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  registerTeam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.body;
    const result = await tournamentService.registerTeam(req.params.id, teamId);
    sendSuccess(res, result);
  });

  generateBrackets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const matches = await tournamentService.generateBrackets(req.params.id);
    sendSuccess(res, matches);
  });
}

export const tournamentController = new TournamentController();
