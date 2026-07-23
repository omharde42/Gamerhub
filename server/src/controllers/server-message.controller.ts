import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { io } from '../index';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class ServerMessageController {
  send = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { channelId, content, media } = req.body;
    const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
    if (!channel || channel.type === 'VOICE') return sendError(res, 400, 'Invalid channel');
    
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } },
    });
    if (!member) return sendError(res, 403, 'Not a member');

    // Enforce permissions:
    // 1. Private channels can only be posted to by OWNER, ADMIN, MODERATOR
    if (channel.isPrivate && !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return sendError(res, 403, 'Only owners, admins, and moderators can send messages in private channels');
    }

    // 2. Announcement channels can only be posted to by OWNER, ADMIN, MODERATOR
    if (channel.type === 'ANNOUNCEMENT' && !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return sendError(res, 403, 'Only owners, admins, and moderators can send announcements');
    }

    const message = await prisma.serverMessage.create({
      data: { channelId, senderId: req.user!.userId, content, media: media || [] },
      include: {
        sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } },
        reactions: true,
      },
    });
    io.to(`server:${channel.serverId}`).emit('server:message', message);
    sendSuccess(res, message, undefined, 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { channelId } = req.params;
    const channel = await prisma.channel.findUnique({ where: { id: channelId }, include: { server: true } });
    if (!channel) return sendError(res, 404, 'Channel not found');
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } },
    });
    if (!member) return sendError(res, 403, 'Not a member');

    // Enforce permissions:
    // Private channels can only be read by OWNER, ADMIN, MODERATOR
    if (channel.isPrivate && !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return sendError(res, 403, 'Only owners, admins, and moderators can view messages in private channels');
    }
    const messages = await prisma.serverMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } },
        reactions: { include: { user: { select: { id: true, profile: { select: { username: true } } } } } },
      },
    });
    sendSuccess(res, messages);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await prisma.serverMessage.findUnique({
      where: { id: req.params.id },
      include: { channel: { include: { server: true } } },
    });
    if (!message) return sendError(res, 404, 'Message not found');
    if (message.senderId !== req.user!.userId) return sendError(res, 403, 'Not authorized');
    await prisma.serverMessage.delete({ where: { id: req.params.id } });
    io.to(`server:${message.channel.serverId}`).emit('server:message:deleted', {
      id: req.params.id,
      channelId: message.channelId,
    });
    sendSuccess(res, null, 'Message deleted');
  });

  pin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await prisma.serverMessage.findUnique({
      where: { id: req.params.id },
      include: { channel: { include: { server: true } } },
    });
    if (!message) return sendError(res, 404, 'Message not found');
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: message.channel.serverId, userId: req.user!.userId } },
    });
    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return sendError(res, 403, 'Not authorized');
    }
    const updated = await prisma.serverMessage.update({
      where: { id: req.params.id },
      data: { isPinned: !message.isPinned },
    });
    io.to(`server:${message.channel.serverId}`).emit('server:message:pinned', updated);
    sendSuccess(res, updated);
  });

  addReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emoji } = req.body;
    const message = await prisma.serverMessage.findUnique({
      where: { id: req.params.id },
      include: { channel: { include: { server: true } } },
    });
    if (!message) return sendError(res, 404, 'Message not found');
    const existing = await prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId: req.params.id, userId: req.user!.userId, emoji } },
    });
    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      io.to(`server:${message.channel.serverId}`).emit('server:reaction:removed', {
        messageId: req.params.id, emoji, userId: req.user!.userId,
      });
      sendSuccess(res, { removed: true });
    } else {
      const reaction = await prisma.messageReaction.create({
        data: { messageId: req.params.id, userId: req.user!.userId, emoji },
      });
      io.to(`server:${message.channel.serverId}`).emit('server:reaction:added', {
        messageId: req.params.id, reaction,
      });
      sendSuccess(res, reaction, undefined, 201);
    }
  });
}

export const serverMessageController = new ServerMessageController();
