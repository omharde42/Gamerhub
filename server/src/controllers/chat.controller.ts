import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { chatService } from '../services/chat.service';
export class ChatController {
  async createDirectMessage(req: AuthRequest, res: Response, next: NextFunction) { try { const { userId } = req.body; const chat = await chatService.createDirectMessage(req.user!.userId, userId); res.json({ success: true, data: chat }); } catch (error) { next(error); } }
  async createGroupChat(req: AuthRequest, res: Response, next: NextFunction) { try { const { name, userIds } = req.body; const chat = await chatService.createGroupChat(name, [req.user!.userId, ...userIds]); res.status(201).json({ success: true, data: chat }); } catch (error) { next(error); } }
  async getUserChats(req: AuthRequest, res: Response, next: NextFunction) { try { const chats = await chatService.getUserChats(req.user!.userId); res.json({ success: true, data: chats }); } catch (error) { next(error); } }
  async getChatMessages(req: AuthRequest, res: Response, next: NextFunction) { try { const { page, limit } = req.query; const result = await chatService.getChatMessages(req.params.id, page ? parseInt(page as string) : undefined, limit ? parseInt(limit as string) : undefined); res.json({ success: true, ...result }); } catch (error) { next(error); } }
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) { try { const message = await chatService.sendMessage(req.params.id, req.user!.userId, req.body); res.status(201).json({ success: true, data: message }); } catch (error) { next(error); } }
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) { try { const result = await chatService.markAsRead(req.params.id, req.user!.userId); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async setTyping(req: AuthRequest, res: Response, next: NextFunction) { try { const { isTyping } = req.body; await chatService.setTyping(req.params.id, req.user!.userId, isTyping); res.json({ success: true }); } catch (error) { next(error); } }
}
export const chatController = new ChatController();
