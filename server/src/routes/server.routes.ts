import { Router } from 'express';
import { serverController } from '../controllers/server.controller';
import { channelController } from '../controllers/channel.controller';
import { serverMessageController } from '../controllers/server-message.controller';
import { serverEventController } from '../controllers/server-event.controller';
import { authenticate } from '../middleware/auth';
const router = Router();

router.get('/discover', authenticate, serverController.discover.bind(serverController));
router.post('/', authenticate, serverController.create.bind(serverController));
router.get('/', authenticate, serverController.list.bind(serverController));
router.get('/:id', authenticate, serverController.getById.bind(serverController));
router.put('/:id', authenticate, serverController.update.bind(serverController));
router.delete('/:id', authenticate, serverController.delete.bind(serverController));
router.post('/join', authenticate, serverController.join.bind(serverController));
router.post('/:id/leave', authenticate, serverController.leave.bind(serverController));
router.post('/:id/regenerate-invite', authenticate, serverController.regenerateInvite.bind(serverController));

// Member moderation
router.put('/:serverId/members/:userId/role', authenticate, serverController.updateMemberRole.bind(serverController));
router.delete('/:serverId/members/:userId', authenticate, serverController.kickMember.bind(serverController));

// Events
router.post('/:serverId/events', authenticate, serverEventController.create.bind(serverEventController));
router.get('/:serverId/events', authenticate, serverEventController.list.bind(serverEventController));
router.delete('/:serverId/events/:id', authenticate, serverEventController.delete.bind(serverEventController));

router.get('/:serverId/channels', authenticate, channelController.list.bind(channelController));
router.post('/:serverId/channels', authenticate, channelController.create.bind(channelController));
router.put('/channels/:id', authenticate, channelController.update.bind(channelController));
router.delete('/channels/:id', authenticate, channelController.delete.bind(channelController));

router.get('/channels/:channelId/messages', authenticate, serverMessageController.list.bind(serverMessageController));
router.post('/messages', authenticate, serverMessageController.send.bind(serverMessageController));
router.delete('/messages/:id', authenticate, serverMessageController.delete.bind(serverMessageController));
router.post('/messages/:id/pin', authenticate, serverMessageController.pin.bind(serverMessageController));
router.post('/messages/:id/react', authenticate, serverMessageController.addReaction.bind(serverMessageController));

export default router;

