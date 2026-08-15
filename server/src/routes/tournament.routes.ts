import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTournamentValidation,
  registerTournamentValidation,
  tournamentIdParamValidation,
} from '../validators/tournament';
const router = Router();
router.get('/', authenticate, tournamentController.list.bind(tournamentController));
router.get('/:id', authenticate, tournamentIdParamValidation, validate, tournamentController.getById.bind(tournamentController));
router.post('/', authenticate, createTournamentValidation, validate, tournamentController.create.bind(tournamentController));
router.post('/:id/register', authenticate, registerTournamentValidation, validate, tournamentController.registerTeam.bind(tournamentController));
router.post('/:id/brackets', authenticate, tournamentIdParamValidation, validate, tournamentController.generateBrackets.bind(tournamentController));
export default router;
