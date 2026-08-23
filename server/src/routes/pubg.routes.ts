import { Router } from 'express';
import { pubgController } from '../controllers/pubg.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public player lookups (viewing a player's public profile by name).
router.get('/player/:platform/:playerName', pubgController.getPlayer);
router.get('/profile', pubgController.getProfile);

// Connecting an account mutates the authenticated user's data — never allow
// anonymous writes (previously fell back to a shared "demo-user").
router.post('/connect', authenticate, pubgController.connect);

export default router;
