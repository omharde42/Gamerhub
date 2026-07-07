import { body } from 'express-validator';
export const registerValidation = [body('email').isEmail().withMessage('Valid email is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'), body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')];
export const loginValidation = [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')];
export const forgotPasswordValidation = [body('email').isEmail().withMessage('Valid email is required')];
export const resetPasswordValidation = [body('token').notEmpty().withMessage('Reset token is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')];
export const twoFactorValidation = [body('token').isString().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit token is required')];
