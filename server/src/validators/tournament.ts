import { body, param } from 'express-validator';

export const createTournamentValidation = [
  body('title').isString().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('description').optional({ values: 'falsy' }).isString().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('game').isString().trim().notEmpty().withMessage('Game is required'),
  body('type').optional().isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS']).withMessage('Invalid tournament type'),
  body('format').optional().isIn(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS']).withMessage('Invalid tournament format'),
  body('maxTeams').isInt({ min: 2, max: 128 }).withMessage('Max teams must be between 2 and 128'),
  body('prizePool').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Prize pool must be a non-negative number'),
  body('entryFee').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Entry fee must be a non-negative number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('rules').optional({ values: 'falsy' }).isString().isLength({ max: 5000 }).withMessage('Rules are too long'),
];

export const registerTournamentValidation = [
  param('id').isUUID().withMessage('Valid tournament ID is required'),
  body('teamId').optional({ values: 'falsy' }).isUUID().withMessage('Valid team ID is required'),
];

export const tournamentIdParamValidation = [
  param('id').isUUID().withMessage('Valid tournament ID is required'),
];
