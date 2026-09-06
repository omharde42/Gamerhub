import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTournamentValidation,
  registerTournamentValidation,
  tournamentIdParamValidation,
  submitResultValidation,
  disputeValidation,
  resolveDisputeValidation,
} from '../validators/tournament';

const router = Router();

// Protected user-specific list
router.get('/my', authenticate, tournamentController.myTournaments.bind(tournamentController));

// Public / optional auth read endpoints
router.get('/', optionalAuth, tournamentController.list.bind(tournamentController));
router.get('/:id', optionalAuth, tournamentIdParamValidation, validate, tournamentController.getById.bind(tournamentController));
router.get('/:id/standings', optionalAuth, tournamentIdParamValidation, validate, tournamentController.getStandings.bind(tournamentController));

// Protected mutation endpoints
router.post('/', authenticate, createTournamentValidation, validate, tournamentController.create.bind(tournamentController));
router.post('/:id/register', authenticate, registerTournamentValidation, validate, tournamentController.registerTeam.bind(tournamentController));
router.post('/:id/brackets', authenticate, tournamentIdParamValidation, validate, tournamentController.generateBrackets.bind(tournamentController));
router.post('/:id/matches/:matchId/result', authenticate, submitResultValidation, validate, tournamentController.submitResult.bind(tournamentController));
router.post('/:id/matches/:matchId/disputes', authenticate, disputeValidation, validate, tournamentController.fileDispute.bind(tournamentController));
router.patch('/:id/disputes/:disputeId', authenticate, resolveDisputeValidation, validate, tournamentController.resolveDispute.bind(tournamentController));

export default router;
