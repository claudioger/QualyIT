import { createMiddleware } from 'hono/factory';
import { verifyToken } from '@clerk/backend';
import type { Env } from '../index';

/**
 * Clerk authentication middleware
 * Verifies the JWT token from the Authorization header
 */
export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  // Skip auth for health check
  if (c.req.path === '/api/health') {
    return next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido',
        },
      },
      401
    );
  }

  const token = authHeader.slice(7);

  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }

    const payload = await verifyToken(token, {
      secretKey,
    });

    if (!payload.sub) {
      throw new Error('Invalid token payload');
    }

    // Set the Clerk user ID in context
    c.set('clerkUserId', payload.sub);

    await next();
  } catch (error) {
    console.error('Auth error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido o expirado',
        },
      },
      401
    );
  }
});
