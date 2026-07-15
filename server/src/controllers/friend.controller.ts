import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { ConflictError, NotFoundError, ForbiddenError } from '../utils/errors';

export class FriendController {
  sendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    if (userId === req.user!.userId) {
      return sendError(res, 400, 'Cannot send friend request to yourself');
    }
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.user!.userId, receiverId: userId },
          { senderId: userId, receiverId: req.user!.userId },
        ],
      },
    });
    if (existing) throw new ConflictError('Friend request already exists');
    const request = await prisma.friendRequest.create({
      data: { senderId: req.user!.userId, receiverId: userId },
    });
    sendSuccess(res, request, 'Friend request sent', 201);
  });

  acceptRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new NotFoundError('Friend request');
    if (request.receiverId !== req.user!.userId) throw new ForbiddenError('Not authorized to accept this request');
    const updated = await prisma.friendRequest.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED' },
    });
    sendSuccess(res, updated, 'Friend request accepted');
  });

  rejectRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new NotFoundError('Friend request');
    if (request.receiverId !== req.user!.userId) throw new ForbiddenError('Not authorized to reject this request');
    await prisma.friendRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    sendSuccess(res, null, 'Request rejected');
  });

  removeFriend = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: req.user!.userId, receiverId: userId },
          { senderId: userId, receiverId: req.user!.userId },
        ],
        status: 'ACCEPTED',
      },
    });
    sendSuccess(res, null, 'Friend removed');
  });

  listFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const [sent, received] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { senderId: req.user!.userId, status: 'ACCEPTED' },
        include: {
          receiver: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } },
        },
      }),
      prisma.friendRequest.findMany({
        where: { receiverId: req.user!.userId, status: 'ACCEPTED' },
        include: {
          sender: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } },
        },
      }),
    ]);
    const friends = [...sent.map((r: any) => r.receiver), ...received.map((r: any) => r.sender)];
    sendSuccess(res, friends);
  });

  listRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: req.user!.userId, status: 'PENDING' },
      include: { sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } } },
    });
    sendSuccess(res, requests);
  });
}

export const friendController = new FriendController();
