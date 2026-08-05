import { Router } from 'express';
import { clashOfClansController } from '../controllers/clashofclans.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/clashofclans/player/:tag - Get live/cached stats for player tag
router.get('/player/:tag', clashOfClansController.getPlayer);

// POST /api/clashofclans/connect - Connect Clash of Clans account for authenticated user
router.post('/connect', authenticate, clashOfClansController.connectAccount);

export default router;
