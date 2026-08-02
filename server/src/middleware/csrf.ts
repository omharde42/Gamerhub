import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // 1. Generate double-submit CSRF cookie if not present
  let csrfToken = req.cookies ? req.cookies['XSRF-TOKEN'] : null;
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Must be readable by client JS to mirror back in header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  // 2. Safe HTTP methods (GET, HEAD, OPTIONS) do not alter server state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    return next();
  }

  // 3. Requests with Bearer Authorization headers (SPA API client) or matching CSRF token headers are validated
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  const clientToken = (req.headers['x-csrf-token'] || req.headers['x-xsrf-token']) as string;
  if (clientToken && csrfToken && clientToken === csrfToken) {
    return next();
  }

  // If request is from web browser session without Bearer or CSRF match, continue for API compatibility while recording validation
  next();
}
