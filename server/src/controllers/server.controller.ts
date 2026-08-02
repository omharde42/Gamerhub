import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { randomBytes } from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class ServerController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, avatar, banner, isPublic } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + randomBytes(4).toString('hex');
    const inviteCode = randomBytes(8).toString('hex');
    const server = await prisma.server.create({
      data: { name, slug, description, avatar, banner, isPublic: isPublic || false, inviteCode, ownerId: req.user!.userId, memberCount: 1 },
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
    sendSuccess(res, { serverId: server.id }, 'Joined server');
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

  updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId, userId } = req.params;
    const { role } = req.body;

    if (!['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'].includes(role)) {
      return sendError(res, 400, 'Invalid role');
    }

    const requesterMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });

    if (!requesterMember || !['OWNER', 'ADMIN'].includes(requesterMember.role)) {
      return sendError(res, 403, 'Only owners and admins can manage roles');
    }

    const targetMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!targetMember) {
      return sendError(res, 404, 'Member not found');
    }

    // Role Hierarchy rules:
    // 1. Cannot modify owner's role
    if (targetMember.role === 'OWNER' && targetMember.userId !== req.user!.userId) {
      return sendError(res, 403, 'Cannot modify the owner\'s role');
    }

    // 2. Requester can only modify roles below their own role.
    // OWNER is above all. ADMIN is above MODERATOR/MEMBER.
    if (requesterMember.role === 'ADMIN') {
      if (role === 'OWNER' || role === 'ADMIN') {
        return sendError(res, 403, 'Admins cannot assign OWNER or ADMIN roles');
      }
      if (targetMember.role === 'ADMIN' && targetMember.userId !== req.user!.userId) {
        return sendError(res, 403, 'Admins cannot modify other admins');
      }
    }

    // 3. Ownership transfer
    if (role === 'OWNER') {
      if (requesterMember.role !== 'OWNER') {
        return sendError(res, 403, 'Only the owner can transfer ownership');
      }
      // Transaction to transfer ownership: demote current owner to ADMIN, make target owner
      await prisma.$transaction([
        prisma.serverMember.update({
          where: { serverId_userId: { serverId, userId: req.user!.userId } },
          data: { role: 'ADMIN' },
        }),
        prisma.serverMember.update({
          where: { serverId_userId: { serverId, userId } },
          data: { role: 'OWNER' },
        }),
        prisma.server.update({
          where: { id: serverId },
          data: { ownerId: userId },
        }),
      ]);
      return sendSuccess(res, null, 'Ownership transferred successfully');
    }

    const updated = await prisma.serverMember.update({
      where: { serverId_userId: { serverId, userId } },
      data: { role: role as any },
    });

    sendSuccess(res, updated, 'Role updated successfully');
  });

  kickMember = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId, userId } = req.params;

    const requesterMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });

    if (!requesterMember || !['OWNER', 'ADMIN', 'MODERATOR'].includes(requesterMember.role)) {
      return sendError(res, 403, 'Not authorized to kick members');
    }

    const targetMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId } },
    });

    if (!targetMember) {
      return sendError(res, 404, 'Member not found');
    }

    // Role Hierarchy rules:
    // OWNER can kick anyone.
    // ADMIN can kick MODERATOR and MEMBER.
    // MODERATOR can kick MEMBER.
    const roleValues = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
    const requesterValue = roleValues[requesterMember.role as keyof typeof roleValues] || 0;
    const targetValue = roleValues[targetMember.role as keyof typeof roleValues] || 0;

    if (requesterValue <= targetValue) {
      return sendError(res, 403, 'Cannot kick someone with an equal or higher role');
    }

    await prisma.$transaction([
      prisma.serverMember.delete({
        where: { serverId_userId: { serverId, userId } },
      }),
      prisma.server.update({
        where: { id: serverId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    sendSuccess(res, null, 'Member kicked successfully');
  });
}

export const serverController = new ServerController();

