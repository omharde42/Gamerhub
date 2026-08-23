import { Router } from 'express';
import { gameStatsController } from '../controllers/game-stats.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/user/:userId', gameStatsController.getUserGameAccounts);
router.post('/verify', authenticate, gameStatsController.verifyGameAccount);
router.delete('/:id', authenticate, gameStatsController.unlinkGameAccount);

export default router;
