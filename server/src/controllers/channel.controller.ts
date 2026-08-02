import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class ChannelController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, type, description, position, isPrivate } = req.body;
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: req.params.serverId, userId: req.user!.userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return sendError(res, 403, 'Not authorized');
    }
    const maxPos = await prisma.channel.aggregate({
      where: { serverId: req.params.serverId },
      _max: { position: true },
    });
    const channel = await prisma.channel.create({
      data: {
        name,
        type: type || 'TEXT',
        description,
        serverId: req.params.serverId,
        position: position ?? (maxPos._max.position ?? -1) + 1,
        isPrivate: isPrivate || false,
      },
    });
    sendSuccess(res, channel, undefined, 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId } = req.params;
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });
    if (!member) return sendError(res, 403, 'Not a member of this server');

    const channels = await prisma.channel.findMany({
      where: { serverId },
      orderBy: { position: 'asc' },
    });

    // Filter out private channels if user is only a normal MEMBER
    const filtered = channels.filter((c: any) => {
      if (!c.isPrivate) return true;
      return ['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role);
    });

    sendSuccess(res, filtered);
  });

  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const channel = await prisma.channel.findUnique({ where: { id: req.params.id } });
    if (!channel) return sendError(res, 404, 'Channel not found');
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return sendError(res, 403, 'Not authorized');
    }
    const updated = await prisma.channel.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, updated);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const channel = await prisma.channel.findUnique({ where: { id: req.params.id } });
    if (!channel) return sendError(res, 404, 'Channel not found');
    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: channel.serverId, userId: req.user!.userId } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return sendError(res, 403, 'Not authorized');
    }
    await prisma.channel.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Channel deleted');
  });
}

export const channelController = new ChannelController();
