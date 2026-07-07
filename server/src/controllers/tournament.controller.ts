import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { tournamentService } from '../services/tournament.service';
export class TournamentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { const tournament = await tournamentService.create(req.body, req.user!.userId); res.status(201).json({ success: true, data: tournament }); } catch (error) { next(error); } }
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { const tournament = await tournamentService.getById(req.params.id); res.json({ success: true, data: tournament }); } catch (error) { next(error); } }
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit, status, game } = req.query; const result = await tournamentService.list({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, status: status as string, game: game as string }); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async registerTeam(req: AuthRequest, res: Response, next: NextFunction) { try { const { teamId } = req.body; const result = await tournamentService.registerTeam(req.params.id, teamId); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async generateBrackets(req: AuthRequest, res: Response, next: NextFunction) { try { const matches = await tournamentService.generateBrackets(req.params.id); res.json({ success: true, data: matches }); } catch (error) { next(error); } }
}
export const tournamentController = new TournamentController();
