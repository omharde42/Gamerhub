import { body, param } from 'express-validator';

export const createChallengeValidation = [
  body('opponentId').isUUID().withMessage('Valid opponent user ID is required'),
  body('game').isString().notEmpty().withMessage('Game is required'),
  body('challengeType')
    .isIn(['ONE_VS_ONE', 'TEAM_VS_TEAM'])
    .withMessage('Challenge type must be ONE_VS_ONE or TEAM_VS_TEAM'),
  body('gameMode').isString().isLength({ min: 1, max: 60 }).withMessage('Game mode is required (max 60 characters)'),
  body('message').optional({ values: 'falsy' }).isString().isLength({ max: 500 }).withMessage('Message is too long (max 500 characters)'),
  body('scheduledAt').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid scheduled date'),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid expiry date'),
  body('challengerTeam').optional().isArray({ max: 5 }).withMessage('Challenger team can have at most 5 members'),
  body('challengerTeam.*').optional().isString().isLength({ max: 40 }).withMessage('Invalid challenger username'),
  body('opponentTeam').optional().isArray({ max: 5 }).withMessage('Opponent team can have at most 5 members'),
  body('opponentTeam.*').optional().isString().isLength({ max: 40 }).withMessage('Invalid opponent username'),
];

export const challengeIdParamValidation = [
  param('id').isUUID().withMessage('Valid challenge ID is required'),
];

export const targetIdParamValidation = [
  param('targetId').isUUID().withMessage('Valid user ID is required'),
];

export const blockUserValidation = [
  body('targetId').isUUID().withMessage('Valid user ID is required'),
];

export const reportUserValidation = [
  body('targetId').isUUID().withMessage('Valid user ID is required'),
  body('reason')
    .isIn(['SPAM', 'HARASSMENT', 'CHEATING', 'TOXIC_BEHAVIOR', 'INAPPROPRIATE_CONTENT', 'OTHER', 'TOXICITY', 'IMPERSONATION'])
    .withMessage('Invalid report reason'),
  body('description').optional({ values: 'falsy' }).isString().isLength({ max: 1000 }).withMessage('Description is too long (max 1000 characters)'),
];

export const completeChallengeValidation = [
  body('winner')
    .optional({ values: 'falsy' })
    .isIn(['challenger', 'opponent', 'draw'])
    .withMessage('Winner must be challenger, opponent or draw'),
];
