import { Router } from 'express';
import { friendController } from '../controllers/friend.controller';
import { authenticate } from '../middleware/auth';
const router = Router();

router.post('/request', authenticate, friendController.sendRequest.bind(friendController));
router.post('/accept/:id', authenticate, friendController.acceptRequest.bind(friendController));
router.post('/reject/:id', authenticate, friendController.rejectRequest.bind(friendController));
router.post('/remove', authenticate, friendController.removeFriend.bind(friendController));
router.get('/', authenticate, friendController.listFriends.bind(friendController));
router.get('/requests', authenticate, friendController.listRequests.bind(friendController));

export default router;
