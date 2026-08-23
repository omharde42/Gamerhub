import { Router } from 'express';
import { challengeController } from '../controllers/challenge.controller';
import { authenticate } from '../middleware/auth';
import { challengeLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import {
  blockUserValidation,
  challengeIdParamValidation,
  completeChallengeValidation,
  createChallengeValidation,
  reportUserValidation,
  targetIdParamValidation,
} from '../validators/challenge';

const router = Router();

// Public metadata (game + modes available for challenges)
router.get('/game-modes', challengeController.getGameModes);

// ── Authenticated challenge management ───────────────────────────
router.get('/', authenticate, challengeController.list);
router.get('/counts', authenticate, challengeController.counts);
router.get('/blocks', authenticate, challengeController.listBlocks);
router.get('/:id', authenticate, challengeIdParamValidation, validate, challengeController.getById);

// Challenge lifecycle
router.post('/', authenticate, challengeLimiter, createChallengeValidation, validate, challengeController.create);
router.post('/:id/accept', authenticate, challengeIdParamValidation, validate, challengeController.accept);
router.post('/:id/decline', authenticate, challengeIdParamValidation, validate, challengeController.decline);
router.post('/:id/cancel', authenticate, challengeIdParamValidation, validate, challengeController.cancel);
router.post('/:id/complete', authenticate, challengeIdParamValidation, completeChallengeValidation, validate, challengeController.complete);
router.post('/:id/report', authenticate, challengeIdParamValidation, reportUserValidation, validate, challengeController.report);

// Abuse controls (block / unblock / report)
router.post('/block', authenticate, blockUserValidation, validate, challengeController.block);
router.delete('/block/:targetId', authenticate, targetIdParamValidation, validate, challengeController.unblock);

export default router;
