import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Error caught in middleware:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    details: err.details || null
  });
}
