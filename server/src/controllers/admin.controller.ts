import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AdminController {
  getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [users, tournaments, jobs, orgs, reports, posts] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.job.count(),
      prisma.organization.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.post.count(),
    ]);
    sendSuccess(res, { users, tournaments, jobs, orgs, pendingReports: reports, posts });
  });

  getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit as string),
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    sendSuccess(res, users, undefined, 200, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  });

  banUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { banned: true, banReason: reason },
    });
    sendSuccess(res, null, 'User banned');
  });

  unbanUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { banned: false, banReason: null },
    });
    sendSuccess(res, null, 'User unbanned');
  });

  getReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        skip,
        take: parseInt(limit as string),
        include: {
          reporter: { select: { id: true, email: true, profile: true } },
          reported: { select: { id: true, email: true, profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count(),
    ]);
    sendSuccess(res, reports, undefined, 200, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  });

  resolveReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { resolution } = req.body;
    await prisma.report.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolution, resolvedAt: new Date() },
    });
    sendSuccess(res, null, 'Report resolved');
  });

  getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: parseInt(limit as string),
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);
    sendSuccess(res, logs, undefined, 200, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  });
}

export const adminController = new AdminController();
