import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import {
  createDirectMessageValidation,
  createGroupChatValidation,
  sendMessageValidation,
  paginationValidation,
  idParamValidation,
} from '../validators/chat';
import { validate } from '../middleware/validate';
const router = Router();

router.get('/', authenticate, chatController.getUserChats);
router.get('/:id/messages', authenticate, idParamValidation, paginationValidation, validate, chatController.getChatMessages);
router.post('/direct', authenticate, createDirectMessageValidation, validate, chatController.createDirectMessage);
router.post('/group', authenticate, createGroupChatValidation, validate, chatController.createGroupChat);
router.post('/:id/messages', authenticate, idParamValidation, sendMessageValidation, validate, chatController.sendMessage);
router.post('/:id/read', authenticate, idParamValidation, chatController.markAsRead);
router.post('/:id/typing', authenticate, idParamValidation, chatController.setTyping);

export default router;
