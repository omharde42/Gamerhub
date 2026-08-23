import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { uploadMedia } from '../middleware/upload';
import {
  createDirectMessageValidation,
  createGroupChatValidation,
  sendMessageValidation,
  paginationValidation,
  idParamValidation,
  editMessageValidation,
  messageActionValidation,
  reactionValidation,
  pinValidation,
  searchValidation,
} from '../validators/chat';
import { validate } from '../middleware/validate';
const router = Router();

router.get('/', authenticate, chatController.getUserChats);
router.get('/unread-counts', authenticate, chatController.getUnreadCounts);
router.get('/:id/messages', authenticate, idParamValidation, paginationValidation, validate, chatController.getChatMessages);
router.get('/:id/search', authenticate, idParamValidation, searchValidation, validate, chatController.searchMessages);
router.post('/upload', authenticate, uploadMedia, chatController.uploadMedia);
router.post('/direct', authenticate, createDirectMessageValidation, validate, chatController.createDirectMessage);
router.post('/group', authenticate, createGroupChatValidation, validate, chatController.createGroupChat);
router.post('/:id/messages', authenticate, idParamValidation, sendMessageValidation, validate, chatController.sendMessage);
router.patch('/:id/messages/:messageId', authenticate, messageActionValidation, editMessageValidation, validate, chatController.editMessage);
router.delete('/:id/messages/:messageId', authenticate, messageActionValidation, validate, chatController.deleteMessage);
router.post('/:id/messages/:messageId/reactions', authenticate, messageActionValidation, reactionValidation, validate, chatController.toggleReaction);
router.post('/:id/messages/:messageId/pin', authenticate, messageActionValidation, pinValidation, validate, chatController.setPinned);
router.post('/:id/read', authenticate, idParamValidation, chatController.markAsRead);
router.post('/:id/typing', authenticate, idParamValidation, chatController.setTyping);

export default router;
