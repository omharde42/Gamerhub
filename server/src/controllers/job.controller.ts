import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { jobService } from '../services/job.service';
export class JobController {
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { const job = await jobService.create(req.body, req.user!.userId); res.status(201).json({ success: true, data: job }); } catch (error) { next(error); } }
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit, type, game, status } = req.query; const result = await jobService.list({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, type: type as string, game: game as string, status: status as string }); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async apply(req: AuthRequest, res: Response, next: NextFunction) { try { const { message } = req.body; const application = await jobService.apply(req.params.id, req.user!.userId, message); res.json({ success: true, data: application }); } catch (error) { next(error); } }
  async save(req: AuthRequest, res: Response, next: NextFunction) { try { await jobService.save(req.user!.userId, req.params.id); res.json({ success: true, message: 'Job saved' }); } catch (error) { next(error); } }
  async unsave(req: AuthRequest, res: Response, next: NextFunction) { try { await jobService.unsave(req.user!.userId, req.params.id); res.json({ success: true, message: 'Job unsaved' }); } catch (error) { next(error); } }
}
export const jobController = new JobController();
