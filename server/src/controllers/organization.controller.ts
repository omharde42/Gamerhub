import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { organizationService } from '../services/organization.service';
export class OrganizationController {
  async create(req: AuthRequest, res: Response, next: NextFunction) { try { const org = await organizationService.create(req.body, req.user!.userId); res.status(201).json({ success: true, data: org }); } catch (error) { next(error); } }
  async getBySlug(req: AuthRequest, res: Response, next: NextFunction) { try { const org = await organizationService.getBySlug(req.params.slug); res.json({ success: true, data: org }); } catch (error) { next(error); } }
  async list(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit, verified } = req.query; const result = await organizationService.list({ page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined, verified: verified === 'true' }); res.json({ success: true, ...result }); } catch (error) { next(error); } }
}
export const organizationController = new OrganizationController();
