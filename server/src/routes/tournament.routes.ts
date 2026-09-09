import { Router } from 'express';
import { tournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTournamentValidation,
  registerTournamentValidation,
  tournamentIdParamValidation,
  submitResultValidation,
  disputeValidation,
  resolveDisputeValidation,
  teamRegistrationDecisionValidation,
  matchCredentialsValidation,
  announcementValidation,
  organizerRatingValidation,
} from '../validators/tournament';

const router = Router();
router.get('/my', authenticate, tournamentController.myTournaments.bind(tournamentController));
router.get('/', authenticate, tournamentController.list.bind(tournamentController));
router.get('/:id', authenticate, tournamentIdParamValidation, validate, tournamentController.getById.bind(tournamentController));
router.get('/:id/standings', authenticate, tournamentIdParamValidation, validate, tournamentController.getStandings.bind(tournamentController));
router.get('/:id/announcements', authenticate, tournamentIdParamValidation, validate, tournamentController.getAnnouncements.bind(tournamentController));
router.get('/:id/analytics', authenticate, tournamentIdParamValidation, validate, tournamentController.getAnalytics.bind(tournamentController));

router.post('/', authenticate, createTournamentValidation, validate, tournamentController.create.bind(tournamentController));
router.post('/:id/register', authenticate, registerTournamentValidation, validate, tournamentController.registerTeam.bind(tournamentController));
router.post('/:id/check-in', authenticate, tournamentIdParamValidation, validate, tournamentController.checkIn.bind(tournamentController));
router.post('/:id/brackets', authenticate, tournamentIdParamValidation, validate, tournamentController.generateBrackets.bind(tournamentController));
router.post('/:id/announcements', authenticate, announcementValidation, validate, tournamentController.createAnnouncement.bind(tournamentController));
router.post('/:id/rate-organizer', authenticate, organizerRatingValidation, validate, tournamentController.rateOrganizer.bind(tournamentController));

router.post('/:id/registrations/:teamId/accept', authenticate, teamRegistrationDecisionValidation, validate, tournamentController.acceptTeam.bind(tournamentController));
router.post('/:id/registrations/:teamId/reject', authenticate, teamRegistrationDecisionValidation, validate, tournamentController.rejectTeam.bind(tournamentController));

router.post('/:id/matches/:matchId/credentials', authenticate, matchCredentialsValidation, validate, tournamentController.setMatchCredentials.bind(tournamentController));
router.post('/:id/matches/:matchId/result', authenticate, submitResultValidation, validate, tournamentController.submitResult.bind(tournamentController));
router.post('/:id/matches/:matchId/disputes', authenticate, disputeValidation, validate, tournamentController.fileDispute.bind(tournamentController));
router.patch('/:id/disputes/:disputeId', authenticate, resolveDisputeValidation, validate, tournamentController.resolveDispute.bind(tournamentController));

export default router;
