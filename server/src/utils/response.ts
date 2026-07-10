import { Response } from 'express';

export interface ApiResponseBody<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, any>;
}

export const sendSuccess = <T>(res: Response, data?: T, message?: string, statusCode = 200, meta?: Record<string, any>) => {
  const body: ApiResponseBody<T> = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const sendError = (res: Response, statusCode: number, message: string, errors?: Record<string, string[]>) => {
  const body: ApiResponseBody = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
