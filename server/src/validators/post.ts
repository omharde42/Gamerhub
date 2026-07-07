import { body } from 'express-validator';
export const createPostValidation = [body('content').isLength({ min: 1, max: 5000 }).withMessage('Content must be 1-5000 characters'), body('type').optional().isIn(['POST', 'ARTICLE', 'CLIP', 'POLL']), body('tags').optional().isArray(), body('media').optional().isArray()];
