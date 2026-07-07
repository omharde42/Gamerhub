import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { teamService } from '../services/team.service';
export class TeamController {
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { const team = await teamService.create(req.body, req.user!.userId); res.status(201).json({ success: true, data: team }); } catch (error) { next(error); } }
  async getById(req: AuthRequest, res: Response, next: NextFunction) { try { const team = await teamService.getById(req.params.id); res.json({ success: true, data: team }); } catch (error) { next(error); } }
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit, region, rank } = req.query; const result = await teamService.list({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, region: region as string, rank: rank as string }); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async update(req: AuthRequest, res: Response, next: NextFunction) { try { const team = await teamService.update(req.params.id, req.body, req.user!.userId); res.json({ success: true, data: team }); } catch (error) { next(error); } }
  async invite(req: AuthRequest, res: Response, next: NextFunction) { try { const { userId } = req.body; const invite = await teamService.invite(req.params.id, userId, req.user!.userId); res.json({ success: true, data: invite }); } catch (error) { next(error); } }
  async acceptInvite(req: AuthRequest, res: Response, next: NextFunction) { try { await teamService.acceptInvite(req.params.id, req.user!.userId); res.json({ success: true, message: 'Joined team' }); } catch (error) { next(error); } }
  async apply(req: AuthRequest, res: Response, next: NextFunction) { try { const { message } = req.body; const application = await teamService.apply(req.params.id, req.user!.userId, message); res.status(201).json({ success: true, data: application }); } catch (error) { next(error); } }
  async kick(req: AuthRequest, res: Response, next: NextFunction) { try { const { userId } = req.body; await teamService.kick(req.params.id, userId, req.user!.userId); res.json({ success: true, message: 'Member removed' }); } catch (error) { next(error); } }
}
export const teamController = new TeamController();
