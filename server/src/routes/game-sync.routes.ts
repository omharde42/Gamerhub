import { Router } from 'express';
import { gameSyncController } from '../controllers/game-sync.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/connected-accounts', gameSyncController.listConnectedAccounts);
router.post('/sync/:platform', gameSyncController.syncPlatform);
router.delete('/disconnect/:platform', gameSyncController.disconnectPlatform);

export default router;
