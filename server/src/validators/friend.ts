import { body, param } from 'express-validator';

export const sendFriendRequestValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
];

export const friendIdParamValidation = [
  param('id').isUUID().withMessage('Valid request ID is required'),
];

export const removeFriendValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
];
