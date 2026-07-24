import { Router } from 'express';
import { cryptoController } from '../controllers/crypto.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/keys', authenticate, cryptoController.registerKeys);
router.get('/keys/:userId', authenticate, cryptoController.getPublicKey);

export default router;
