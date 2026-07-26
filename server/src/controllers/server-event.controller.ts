import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';

export class ServerEventController {
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId } = req.params;
    const { title, description, location, startDate, endDate } = req.body;

    if (!title || !location || !startDate) {
      return sendError(res, 400, 'Title, location, and start date are required');
    }

    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });

    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return sendError(res, 403, 'Only server owners, admins, or moderators can create events');
    }

    const event = await prisma.serverEvent.create({
      data: {
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        serverId,
        creatorId: req.user!.userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, event, 'Event created successfully', 201);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId } = req.params;

    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });

    if (!member) {
      return sendError(res, 403, 'Not a member of this server');
    }

    const events = await prisma.serverEvent.findMany({
      where: { serverId },
      orderBy: { startDate: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    sendSuccess(res, events);
  });

  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { serverId, id } = req.params;

    const event = await prisma.serverEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    const member = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId, userId: req.user!.userId } },
    });

    const isCreator = event.creatorId === req.user!.userId;
    const hasPrivileges = member && ['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role);

    if (!isCreator && !hasPrivileges) {
      return sendError(res, 403, 'Not authorized to delete this event');
    }

    await prisma.serverEvent.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Event deleted successfully');
  });
}

export const serverEventController = new ServerEventController();
