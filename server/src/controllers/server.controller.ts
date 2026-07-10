import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { randomBytes } from 'crypto';

export class ServerController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
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
      const full = await prisma.server.findUnique({ where: { id: server.id }, include: { channels: { orderBy: { position: 'asc' } }, members: { include: { user: { select: { id: true, profile: { select: { username: true, avatar: true } } } } } } } });
      res.status(201).json({ success: true, data: full });
    } catch (error) { next(error); }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const servers = await prisma.server.findMany({
        where: { members: { some: { userId: req.user!.userId } } },
        include: { channels: { orderBy: { position: 'asc' } }, _count: { select: { members: true } } },
      });
      res.json({ success: true, data: servers });
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const server = await prisma.server.findUnique({
        where: { id: req.params.id },
        include: {
          channels: { orderBy: { position: 'asc' } },
          members: { include: { user: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } } } },
          _count: { select: { members: true } },
        },
      });
      if (!server) { res.status(404).json({ success: false, message: 'Server not found' }); return; }
      res.json({ success: true, data: server });
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: req.params.id, userId: req.user!.userId } } });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const server = await prisma.server.update({ where: { id: req.params.id }, data: req.body, include: { channels: { orderBy: { position: 'asc' } } } });
      res.json({ success: true, data: server });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const server = await prisma.server.findUnique({ where: { id: req.params.id } });
      if (!server || server.ownerId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Only the owner can delete this server' }); return; }
      await prisma.server.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Server deleted' });
    } catch (error) { next(error); }
  }

  async join(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = req.body;
      const server = await prisma.server.findUnique({ where: { inviteCode } });
      if (!server) { res.status(404).json({ success: false, message: 'Invalid invite code' }); return; }
      const existing = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: server.id, userId: req.user!.userId } } });
      if (existing) { res.status(400).json({ success: false, message: 'Already a member' }); return; }
      await prisma.serverMember.create({ data: { serverId: server.id, userId: req.user!.userId, role: 'MEMBER' } });
      await prisma.server.update({ where: { id: server.id }, data: { memberCount: { increment: 1 } } });
      res.json({ success: true, message: 'Joined server' });
    } catch (error) { next(error); }
  }

  async leave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const server = await prisma.server.findUnique({ where: { id: req.params.id } });
      if (!server) { res.status(404).json({ success: false, message: 'Server not found' }); return; }
      if (server.ownerId === req.user!.userId) { res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership or delete the server.' }); return; }
      await prisma.serverMember.delete({ where: { serverId_userId: { serverId: req.params.id, userId: req.user!.userId } } });
      await prisma.server.update({ where: { id: req.params.id }, data: { memberCount: { decrement: 1 } } });
      res.json({ success: true, message: 'Left server' });
    } catch (error) { next(error); }
  }

  async regenerateInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const server = await prisma.server.findUnique({ where: { id: req.params.id } });
      if (!server || server.ownerId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const inviteCode = randomBytes(8).toString('hex');
      await prisma.server.update({ where: { id: req.params.id }, data: { inviteCode } });
      res.json({ success: true, data: { inviteCode } });
    } catch (error) { next(error); }
  }

  async discover(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const servers = await prisma.server.findMany({
        where: { isPublic: true },
        take: 20,
        orderBy: { memberCount: 'desc' },
        include: { _count: { select: { members: true } } },
      });
      res.json({ success: true, data: servers });
    } catch (error) { next(error); }
  }
}

export const serverController = new ServerController();
