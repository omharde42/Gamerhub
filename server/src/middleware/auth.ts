import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/helpers';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');
    const token = authHeader.split(' ')[1]; const decoded = verifyToken(token);
    req.user = decoded; next();
  } catch (error) {
    if (error instanceof UnauthorizedError) next(error); else next(new UnauthorizedError('Invalid or expired token'));
  }
};
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) { const token = authHeader.split(' ')[1]; const decoded = verifyToken(token); req.user = decoded; }
  } catch {}
  next();
};
export const authorize = (...roles: string[]) => (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new UnauthorizedError());
  if (!roles.includes(req.user.role)) return next(new UnauthorizedError('Insufficient permissions'));
  next();
};
