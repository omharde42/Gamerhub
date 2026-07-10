import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { randomBytes } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class ServerController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, isPublic } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + randomBytes(4).toString('hex');
    const inviteCode = randomBytes(8).toString('hex');
    const server = await prisma.server.create({
      data: { name, slug, description, isPublic: isPublic || false, inviteCode, ownerId: req.user!.userId, memberCount: 1 },
      include: { channels: true },
    });
    await prisma.serverMember.create({ data: { serverId: server.id, userId: req.user!.userId, role: 'OWNER' } });
    await prisma.channel.create({ data: { name: 'general', serverId: server.id, type: 'TEXT', position: 0 } });
    await prisma.channel.create({ data: { name: 'voice', serverId: server.id, type: 'VOICE', position: 1 } });
    const full = await prisma.server.findUnique({
      where: { id: server.id },
      include: {
        channels: { orderBy: { position: 'asc' } },
        members: { include: { user: { select: { id: true, profile: { select: { username: true, avatar: true } } } } } },
      },
    });
    sendSuccess(res, full, undefined, 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const servers = await prisma.server.findMany({
      where: { members: { some: { userId: req.user!.userId } } },
      include: { channels: { orderBy: { position: 'asc' } }, _count: { select: { members: true } } },
    });
    sendSuccess(res, servers);
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const server = await prisma.server.findUnique({
      where: { id: req.params.id },
      include: {
        channels: { orderBy: { position: 'asc' } },
        members: { include: { user: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } } } },
        _count: { select: { members: true } },
      },
    });
    if (!server) return sendError(res, 404, 'Server not found');
    sendSuccess(res, server);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: req.params.id, userId: req.user!.userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return sendError(res, 403, 'Not authorized');
    }
    const server = await prisma.server.update({
      where: { id: req.params.id },
      data: req.body,
      include: { channels: { orderBy: { position: 'asc' } } },
    });
    sendSuccess(res, server);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server || server.ownerId !== req.user!.userId) {
      return sendError(res, 403, 'Only the owner can delete this server');
    }
    await prisma.server.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Server deleted');
  });

  join = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { inviteCode } = req.body;
    const server = await prisma.server.findUnique({ where: { inviteCode } });
    if (!server) return sendError(res, 404, 'Invalid invite code');
    const existing = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: server.id, userId: req.user!.userId } },
    });
    if (existing) return sendError(res, 400, 'Already a member');
    await prisma.serverMember.create({ data: { serverId: server.id, userId: req.user!.userId, role: 'MEMBER' } });
    await prisma.server.update({ where: { id: server.id }, data: { memberCount: { increment: 1 } } });
    sendSuccess(res, null, 'Joined server');
  });

  leave = asyncHandler(async (req: AuthRequest, res: Response) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server) return sendError(res, 404, 'Server not found');
    if (server.ownerId === req.user!.userId) {
      return sendError(res, 400, 'Owner cannot leave. Transfer ownership or delete the server.');
    }
    await prisma.serverMember.delete({
      where: { serverId_userId: { serverId: req.params.id, userId: req.user!.userId } },
    });
    await prisma.server.update({ where: { id: req.params.id }, data: { memberCount: { decrement: 1 } } });
    sendSuccess(res, null, 'Left server');
  });

  regenerateInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const server = await prisma.server.findUnique({ where: { id: req.params.id } });
    if (!server || server.ownerId !== req.user!.userId) {
      return sendError(res, 403, 'Not authorized');
    }
    const inviteCode = randomBytes(8).toString('hex');
    await prisma.server.update({ where: { id: req.params.id }, data: { inviteCode } });
    sendSuccess(res, { inviteCode });
  });

  discover = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const servers = await prisma.server.findMany({
      where: { isPublic: true },
      take: 20,
      orderBy: { memberCount: 'desc' },
      include: { _count: { select: { members: true } } },
    });
    sendSuccess(res, servers);
  });
}

export const serverController = new ServerController();
