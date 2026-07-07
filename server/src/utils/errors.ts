export class AppError extends Error { public statusCode: number; public isOperational: boolean; constructor(message: string, statusCode: number = 500) { super(message); this.statusCode = statusCode; this.isOperational = true; Object.setPrototypeOf(this, AppError.prototype); } }
export class NotFoundError extends AppError { constructor(resource: string = 'Resource') { super(`${resource} not found`, 404); } }
export class UnauthorizedError extends AppError { constructor(message: string = 'Unauthorized') { super(message, 401); } }
export class ForbiddenError extends AppError { constructor(message: string = 'Forbidden') { super(message, 403); } }
export class ValidationError extends AppError { public errors: Record<string, string[]>; constructor(errors: Record<string, string[]>) { super('Validation failed', 422); this.errors = errors; } }
export class ConflictError extends AppError { constructor(message: string = 'Resource already exists') { super(message, 409); } }
