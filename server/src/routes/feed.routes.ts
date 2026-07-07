import { Router } from 'express';
import { feedController } from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, feedController.getFeed.bind(feedController));
router.post('/follow/:userId', authenticate, feedController.follow.bind(feedController));
router.post('/unfollow/:userId', authenticate, feedController.unfollow.bind(feedController));
export default router;
