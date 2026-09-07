import { Request, Response, NextFunction } from 'express';

export const requestTimingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Production-safe log: path, method, status, duration (no headers, tokens, or body data)
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
};
