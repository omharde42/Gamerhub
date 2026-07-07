import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) { res.status(err.statusCode).json({ success: false, message: err.message, errors: (err as any).errors }); return; }
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => { const path = e.path.join('.'); if (!errors[path]) errors[path] = []; errors[path].push(e.message); });
    res.status(422).json({ success: false, message: 'Validation failed', errors }); return;
  }
  console.error('Unhandled error:', err); res.status(500).json({ success: false, message: 'Internal server error' });
};
export const notFoundHandler = (_req: Request, res: Response): void => { res.status(404).json({ success: false, message: 'Route not found' }); };
