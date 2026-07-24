import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: 'Image is too large. Maximum size is 5MB.' });
      return;
    }
    res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message, errors: (err as any).errors });
    return;
  }
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusMap: Record<string, number> = {
      P2002: 409,
      P2003: 400,
      P2023: 400,
      P2025: 404,
    };
    res.status(statusMap[err.code] || 400).json({ success: false, message: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid input' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
