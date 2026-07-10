import { Response } from 'express';
import { AuthRequest } from '../types';
import { organizationService } from '../services/organization.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class OrganizationController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const org = await organizationService.create(req.body, req.user!.userId);
    sendSuccess(res, org, undefined, 201);
  });

  getBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const org = await organizationService.getBySlug(req.params.slug);
    sendSuccess(res, org);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, verified } = req.query;
    const result = await organizationService.list({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      verified: verified === 'true',
    });
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });
}

export const organizationController = new OrganizationController();
