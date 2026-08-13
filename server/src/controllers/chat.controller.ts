import { Response } from 'express';
import { AuthRequest } from '../types';
import { chatService } from '../services/chat.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { mediaStorageService } from '../utils/storage';

export class ChatController {
  uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 400, 'No files uploaded. Please select an image or video.');
    }

    const uploadPromises = files.map(async (file) => {
      const result = await mediaStorageService.uploadMedia(
        file.buffer,
        file.originalname,
        file.mimetype,
        'chat'
      );
      return result.url;
    });

    const urls = await Promise.all(uploadPromises);
    sendSuccess(res, { urls }, 'Chat media uploaded successfully');
  });

  createDirectMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    const chat = await chatService.createDirectMessage(req.user!.userId, userId);
    sendSuccess(res, chat);
  });

  createGroupChat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, userIds } = req.body;
    const chat = await chatService.createGroupChat(name, [req.user!.userId, ...userIds]);
    sendSuccess(res, chat, undefined, 201);
  });

  getUserChats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const chats = await chatService.getUserChats(req.user!.userId);
    sendSuccess(res, chats);
  });

  getChatMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit } = req.query;
    const result = await chatService.getChatMessages(
      req.user!.userId,
      req.params.id,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
    );
    sendSuccess(res, result.data, undefined, 200, result.meta);
  });

  sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const message = await chatService.sendMessage(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, message, undefined, 201);
  });

  markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await chatService.markAsRead(req.params.id, req.user!.userId);
    sendSuccess(res, result);
  });

  getUnreadCounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const counts = await chatService.getUnreadCounts(req.user!.userId);
    sendSuccess(res, counts);
  });

  setTyping = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { isTyping } = req.body;
    await chatService.setTyping(req.params.id, req.user!.userId, isTyping);
    sendSuccess(res, undefined);
  });
}

export const chatController = new ChatController();
