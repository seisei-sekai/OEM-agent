import { Context } from 'hono';
import { ZodError } from 'zod';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    return c.json({
      error: 'Validation error',
      details: err.errors,
    }, 400);
  }

  if (err.message.includes('not found')) {
    return c.json({
      error: 'Resource not found',
      message: err.message,
    }, 404);
  }

  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  }, 500);
}


