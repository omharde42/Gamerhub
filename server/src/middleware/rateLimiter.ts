import rateLimit from 'express-rate-limit';
export const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, message: 'Too many requests, please try again later' }, standardHeaders: true, legacyHeaders: false });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many authentication attempts, please try again later' }, standardHeaders: true, legacyHeaders: false });
export const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60, message: { success: false, message: 'Too many API requests' }, standardHeaders: true, legacyHeaders: false });
