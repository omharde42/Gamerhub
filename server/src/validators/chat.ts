import { body, param, query } from 'express-validator';

export const createDirectMessageValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
];

export const createGroupChatValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name is required (max 100 chars)'),
  body('userIds').isArray({ min: 1 }).withMessage('At least one user ID is required'),
  body('userIds.*').isUUID().withMessage('Each user ID must be valid'),
];

export const sendMessageValidation = [
  body('content').optional().trim().isLength({ max: 5000 }).withMessage('Message too long (max 5000 chars)'),
  body('media').optional().isArray().withMessage('Media must be an array'),
  body('gif').optional().isString().withMessage('GIF must be a string'),
  body('fileUrl').optional().isString().withMessage('File URL must be a string'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1-100'),
];

export const idParamValidation = [
  param('id').isUUID().withMessage('Valid ID parameter is required'),
];
