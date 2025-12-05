import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { Env } from '../index';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = createMiddleware<Env>(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    // Handle Hono HTTP exceptions
    if (error instanceof HTTPException) {
      return c.json(
        {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: error.message,
          },
        },
        error.status
      );
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        400
      );
    }

    // Handle custom API errors
    if (error instanceof ApiError) {
      return c.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        error.status as ContentfulStatusCode
      );
    }

    // Handle unknown errors
    const message =
      process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'Error interno del servidor';

    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      500
    );
  }
});

/**
 * Custom API error class
 * Use this to throw errors with specific codes and status
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Pre-defined error factories
export const Errors = {
  notFound: (resource: string) =>
    new ApiError('NOT_FOUND', `${resource} no encontrado`, 404),

  unauthorized: (message = 'No autorizado') =>
    new ApiError('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Acceso denegado') =>
    new ApiError('FORBIDDEN', message, 403),

  badRequest: (message: string, details?: Record<string, unknown>) =>
    new ApiError('BAD_REQUEST', message, 400, details),

  conflict: (message: string) =>
    new ApiError('CONFLICT', message, 409),

  internal: (message = 'Error interno del servidor') =>
    new ApiError('INTERNAL_ERROR', message, 500),
};
