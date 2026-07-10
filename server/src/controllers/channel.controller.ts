import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export class ChannelController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, type, description, position, isPrivate } = req.body;
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: req.params.serverId, userId: req.user!.userId } } });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const maxPos = await prisma.channel.aggregate({ where: { serverId: req.params.serverId }, _max: { position: true } });
      const channel = await prisma.channel.create({
        data: { name, type: type || 'TEXT', description, serverId: req.params.serverId, position: position ?? (maxPos._max.position ?? -1) + 1, isPrivate: isPrivate || false },
      });
      res.status(201).json({ success: true, data: channel });
    } catch (error) { next(error); }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channels = await prisma.channel.findMany({
        where: { serverId: req.params.serverId },
        orderBy: { position: 'asc' },
      });
      res.json({ success: true, data: channels });
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await prisma.channel.findUnique({ where: { id: req.params.id } });
      if (!channel) { res.status(404).json({ success: false, message: 'Channel not found' }); return; }
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } } });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const updated = await prisma.channel.update({ where: { id: req.params.id }, data: req.body });
      res.json({ success: true, data: updated });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const channel = await prisma.channel.findUnique({ where: { id: req.params.id } });
      if (!channel) { res.status(404).json({ success: false, message: 'Channel not found' }); return; }
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } } });
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      await prisma.channel.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Channel deleted' });
    } catch (error) { next(error); }
  }
}

export const channelController = new ChannelController();
