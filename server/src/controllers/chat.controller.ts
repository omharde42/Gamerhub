import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../types';
import { chatService } from '../services/chat.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { config } from '../config';
import { v2 as cloudinary } from 'cloudinary';

export class ChatController {
  uploadMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 400, 'No files uploaded. Please select an image or video.');
    }

    const uploadPromises = files.map(async (file, idx) => {
      let mediaUrl = '';

      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        try {
          const b64 = Buffer.from(file.buffer).toString('base64');
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'gamerhub/chat',
            resource_type: 'auto',
          });
          if (result && result.secure_url) {
            mediaUrl = result.secure_url;
          }
        } catch (cloudErr) {
          console.warn('Cloudinary chat media upload warning:', cloudErr);
        }
      }

      if (!mediaUrl) {
        try {
          const uploadsDir = path.resolve(process.cwd(), 'public/uploads/chat');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `chat_${req.user?.userId || 'user'}_${Date.now()}_${idx}${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);

          const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
          const protocol = rawProto.split(',')[0].trim();
          const host = req.get('host') || 'localhost:4000';
          mediaUrl = `${protocol}://${host}/uploads/chat/${filename}`;
        } catch (diskErr) {
          console.warn('Chat disk upload warning, using base64 fallback:', diskErr);
          const b64 = Buffer.from(file.buffer).toString('base64');
          mediaUrl = `data:${file.mimetype};base64,${b64}`;
        }
      }

      return mediaUrl;
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
