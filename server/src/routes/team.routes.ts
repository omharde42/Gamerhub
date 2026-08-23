import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, teamController.list);
router.get('/mine', authenticate, teamController.listMine);
router.get('/invites/mine', authenticate, teamController.myInvites);
router.get('/:id', authenticate, teamController.getById);
router.post('/', authenticate, teamController.create);
router.put('/:id', authenticate, teamController.update);
router.post('/:id/invite', authenticate, teamController.invite);
router.post('/:id/accept-invite', authenticate, teamController.acceptInvite);
router.post('/:id/decline-invite', authenticate, teamController.declineInvite);
router.post('/:id/apply', authenticate, teamController.apply);
router.post('/:id/handle-application', authenticate, teamController.handleApplication);
router.post('/:id/kick', authenticate, teamController.kick);
router.post('/:id/leave', authenticate, teamController.leave);

export default router;
