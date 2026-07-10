import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export class FriendController {
  async sendRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      if (userId === req.user!.userId) { res.status(400).json({ success: false, message: 'Cannot friend yourself' }); return; }
      const existing = await prisma.friendRequest.findFirst({ where: { OR: [{ senderId: req.user!.userId, receiverId: userId }, { senderId: userId, receiverId: req.user!.userId }] } });
      if (existing) { res.status(400).json({ success: false, message: 'Friend request already exists' }); return; }
      const request = await prisma.friendRequest.create({ data: { senderId: req.user!.userId, receiverId: userId } });
      res.status(201).json({ success: true, data: request });
    } catch (error) { next(error); }
  }

  async acceptRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
      if (!request || request.receiverId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      const updated = await prisma.friendRequest.update({ where: { id: req.params.id }, data: { status: 'ACCEPTED' } });
      res.json({ success: true, data: updated });
    } catch (error) { next(error); }
  }

  async rejectRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
      if (!request || request.receiverId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not authorized' }); return; }
      await prisma.friendRequest.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
      res.json({ success: true, message: 'Request rejected' });
    } catch (error) { next(error); }
  }

  async removeFriend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      await prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: req.user!.userId, receiverId: userId }, { senderId: userId, receiverId: req.user!.userId }], status: 'ACCEPTED' } });
      res.json({ success: true, message: 'Friend removed' });
    } catch (error) { next(error); }
  }

  async listFriends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sent = await prisma.friendRequest.findMany({
        where: { senderId: req.user!.userId, status: 'ACCEPTED' },
        include: { receiver: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } } },
      });
      const received = await prisma.friendRequest.findMany({
        where: { receiverId: req.user!.userId, status: 'ACCEPTED' },
        include: { sender: { select: { id: true, presence: true, profile: { select: { username: true, avatar: true } } } } },
      });
      const friends = [...sent.map(r => r.receiver), ...received.map(r => r.sender)];
      res.json({ success: true, data: friends });
    } catch (error) { next(error); }
  }

  async listRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requests = await prisma.friendRequest.findMany({
        where: { receiverId: req.user!.userId, status: 'PENDING' },
        include: { sender: { select: { id: true, profile: { select: { username: true, avatar: true } } } } },
      });
      res.json({ success: true, data: requests });
    } catch (error) { next(error); }
  }
}

export const friendController = new FriendController();
