import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach((error: ValidationError) => {
      const path = (error as any).path || (error as any).param || 'unknown';
      if (!formattedErrors[path]) formattedErrors[path] = [];
      formattedErrors[path].push(error.msg);
    });
    res.status(422).json({ success: false, message: 'Validation failed', errors: formattedErrors });
    return;
  }
  next();
};
