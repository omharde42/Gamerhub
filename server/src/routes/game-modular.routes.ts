import { Router } from 'express';
import { gameModularController } from '../controllers/game-modular.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/game/user-connections - Get user's connected games
router.get('/user-connections', optionalAuth, gameModularController.getUserConnections);

// Dynamic game routes
router.get('/:game/profile', optionalAuth, gameModularController.getGameProfile);
router.get('/:game/stats', optionalAuth, gameModularController.getGameStats);
router.post('/:game/connect', authenticate, gameModularController.connectGame);
router.post('/:game/disconnect', authenticate, gameModularController.disconnectGame);

export default router;
