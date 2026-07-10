import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { io } from '../index';

export class ServerMessageController {
  async send(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { channelId, content, media } = req.body;
      const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
      if (!channel || channel.type === 'VOICE') { res.status(400).json({ success: false, message: 'Invalid channel' }); return; }
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } } });
      if (!member) { res.status(403).json({ success: false, message: 'Not a member' }); return; }
      const message = await prisma.serverMessage.create({
        data: { channelId, senderId: req.user!.userId, content, media: media || [] },
        include: { sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } }, reactions: true },
      });
      io.to(`server:${channel.serverId}`).emit('server:message', message);
      res.status(201).json({ success: true, data: message });
    } catch (error) { next(error); }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
      if (!channel) { res.status(404).json({ success: false, message: 'Channel not found' }); return; }
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } } });
      if (!member) { res.status(403).json({ success: false, message: 'Not a member' }); return; }
      const messages = await prisma.serverMessage.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: { sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } }, reactions: { include: { user: { select: { id: true, profile: { select: { username: true } } } } } } },
      });
      res.json({ success: true, data: messages });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await prisma.serverMessage.findUnique({ where: { id: req.params.id }, include: { channel: { include: { server: true } } } });
      if (!message) { res.status(404).json({ success: false, message: 'Message not found' }); return; }
      if (message.senderId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      await prisma.serverMessage.delete({ where: { id: req.params.id } });
      io.to(`server:${message.channel.serverId}`).emit('server:message:deleted', { id: req.params.id, channelId: message.channelId });
      res.json({ success: true, message: 'Message deleted' });
    } catch (error) { next(error); }
  }

  async pin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const message = await prisma.serverMessage.findUnique({ where: { id: req.params.id }, include: { channel: { include: { server: true } } } });
      if (!message) { res.status(404).json({ success: false, message: 'Message not found' }); return; }
      const member = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: message.channel.serverId, userId: req.user!.userId } } });
      if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const updated = await prisma.serverMessage.update({ where: { id: req.params.id }, data: { isPinned: !message.isPinned } });
      io.to(`server:${message.channel.serverId}`).emit('server:message:pinned', updated);
      res.json({ success: true, data: updated });
    } catch (error) { next(error); }
  }

  async addReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { emoji } = req.body;
      const message = await prisma.serverMessage.findUnique({ where: { id: req.params.id }, include: { channel: { include: { server: true } } } });
      if (!message) { res.status(404).json({ success: false, message: 'Message not found' }); return; }
      const existing = await prisma.messageReaction.findUnique({ where: { messageId_userId_emoji: { messageId: req.params.id, userId: req.user!.userId, emoji } } });
      if (existing) {
        await prisma.messageReaction.delete({ where: { id: existing.id } });
        io.to(`server:${message.channel.serverId}`).emit('server:reaction:removed', { messageId: req.params.id, emoji, userId: req.user!.userId });
        res.json({ success: true, data: { removed: true } });
      } else {
        const reaction = await prisma.messageReaction.create({ data: { messageId: req.params.id, userId: req.user!.userId, emoji } });
        io.to(`server:${message.channel.serverId}`).emit('server:reaction:added', { messageId: req.params.id, reaction });
        res.status(201).json({ success: true, data: reaction });
      }
    } catch (error) { next(error); }
  }
}

export const serverMessageController = new ServerMessageController();
