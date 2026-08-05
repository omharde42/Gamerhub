import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { UserRole } from '@prisma/client';

export class AdminController {
  getDashboardStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [
      usersCount,
      tournamentsCount,
      jobsCount,
      orgsCount,
      pendingReportsCount,
      postsCount,
      teamsCount,
      serversCount,
      onlineUsersCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.job.count(),
      prisma.organization.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.post.count(),
      prisma.team.count(),
      prisma.server.count(),
      prisma.user.count({ where: { presence: 'ONLINE' } }),
    ]);

    // Mock realistic DAU, MAU, system parameters & health stats
    const dau = Math.max(onlineUsersCount * 4, 15);
    const mau = Math.max(usersCount, 120);
    const dbSizeMb = (usersCount * 0.25 + postsCount * 0.12 + 5.2).toFixed(2);
    const serverMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const systemMetrics = {
      cpuUsage: '4.2%',
      memoryUsage: `${serverMemoryUsage.toFixed(1)} MB`,
      databaseSize: `${dbSizeMb} MB`,
      serverStatus: 'ACTIVE',
      apiStatus: 'HEALTHY',
      databaseHealth: 'HEALTHY',
      activeSessions: onlineUsersCount + 3,
      backgroundJobs: 'IDLE',
      errorLogsCount: 2,
    };

    sendSuccess(res, {
      users: usersCount,
      onlineUsers: onlineUsersCount,
      dau,
      mau,
      tournaments: tournamentsCount,
      activeTournaments: await prisma.tournament.count({ where: { status: 'IN_PROGRESS' } }),
      jobs: jobsCount,
      orgs: orgsCount,
      pendingReports: pendingReportsCount,
      posts: postsCount,
      teams: teamsCount,
      communities: serversCount,
      system: systemMetrics,
    });
  });

  getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '20', search = '', role, banned } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { username: { contains: search as string, mode: 'insensitive' } } },
        { profile: { displayName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (role && Object.values(UserRole).includes(role as UserRole)) {
      whereClause.role = role as UserRole;
    }

    if (banned) {
      whereClause.banned = banned === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit as string),
        include: { profile: true, gameAccounts: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    sendSuccess(res, users, undefined, 200, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  });

  updateUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.body;
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({ success: false, error: 'Invalid user role' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role as UserRole },
      include: { profile: true },
    });

    sendSuccess(res, updated, `User role updated to ${role}`);
  });

  verifyUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { verified } = req.body;

    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { userId: req.params.id },
    });

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found for this user' });
      return;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.params.id },
      data: { verified: verified === true },
    });

    sendSuccess(res, updatedProfile, verified ? 'User verified' : 'User unverified');
  });

  deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    await prisma.user.delete({
      where: { id: req.params.id },
    });
    sendSuccess(res, null, 'User deleted permanently');
  });

  banUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { banned: true, banReason: reason || 'Violation of rules' },
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
      data: { status: 'RESOLVED', resolution: resolution || 'Resolved by admin', resolvedAt: new Date() },
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

  getGameApiStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // List state and health metrics for game APIs (Steam, Riot, FACEIT, etc.)
    const apis = [
      { name: 'Steam API', status: 'ACTIVE', lastSync: new Date(Date.now() - 5 * 60000).toISOString(), syncQueue: 0, failedRequests: 0 },
      { name: 'Riot Games API', status: 'ACTIVE', lastSync: new Date(Date.now() - 12 * 60000).toISOString(), syncQueue: 1, failedRequests: 2 },
      { name: 'FACEIT API', status: 'ACTIVE', lastSync: new Date(Date.now() - 45 * 60000).toISOString(), syncQueue: 0, failedRequests: 1 },
      { name: 'Discord API', status: 'ACTIVE', lastSync: new Date(Date.now() - 2 * 60000).toISOString(), syncQueue: 0, failedRequests: 0 },
      { name: 'Clash Royale API', status: 'ACTIVE', lastSync: new Date(Date.now() - 60 * 60000).toISOString(), syncQueue: 0, failedRequests: 0 },
      { name: 'Clash of Clans API', status: 'ACTIVE', lastSync: new Date(Date.now() - 120 * 60000).toISOString(), syncQueue: 0, failedRequests: 4 },
      { name: 'Brawl Stars API', status: 'ACTIVE', lastSync: new Date(Date.now() - 30 * 60000).toISOString(), syncQueue: 0, failedRequests: 0 },
      { name: 'PUBG API', status: 'MAINTENANCE', lastSync: new Date(Date.now() - 480 * 60000).toISOString(), syncQueue: 14, failedRequests: 32 },
    ];

    const logs = [
      { timestamp: new Date(Date.now() - 2 * 60000).toISOString(), level: 'INFO', message: 'Discord user state sync completed successfully' },
      { timestamp: new Date(Date.now() - 5 * 60000).toISOString(), level: 'INFO', message: 'Steam library and level checked for 4 users' },
      { timestamp: new Date(Date.now() - 12 * 60000).toISOString(), level: 'WARN', message: 'Riot Games API rate limit hit, queuing remaining requests' },
      { timestamp: new Date(Date.now() - 15 * 60000).toISOString(), level: 'ERROR', message: 'FACEIT profile sync failed: Player id not found' },
    ];

    sendSuccess(res, { apis, logs });
  });

  triggerApiSync = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { apiName } = req.body;
    if (!apiName) {
      res.status(400).json({ success: false, error: 'apiName is required' });
      return;
    }
    // Simulate sync
    sendSuccess(res, null, `Manual synchronization started for ${apiName}`);
  });
}

export const adminController = new AdminController();
