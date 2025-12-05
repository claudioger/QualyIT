import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { getDb } from '../lib/db';
import { users, tenants } from '@qualyit/database/schema';
import type { Env } from '../index';

/**
 * Tenant resolution middleware
 * Resolves the tenant from the user's Clerk ID or subdomain
 */
export const tenantMiddleware = createMiddleware<Env>(async (c, next) => {
  // Skip for health check
  if (c.req.path === '/api/health') {
    return next();
  }

  const clerkUserId = c.get('clerkUserId');
  if (!clerkUserId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado',
        },
      },
      401
    );
  }

  const db = getDb();

  // Try to resolve tenant from subdomain first
  const host = c.req.header('host') || '';
  const subdomain = host.split('.')[0];

  // Check if it's a valid subdomain (not localhost, app, www, etc.)
  const isValidSubdomain =
    subdomain &&
    subdomain !== 'localhost' &&
    subdomain !== 'app' &&
    subdomain !== 'www' &&
    !subdomain.includes(':');

  let tenantId: string | null = null;
  let userId: string | null = null;
  let userRole: string | null = null;

  if (isValidSubdomain) {
    // Resolve tenant by subdomain
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.subdomain, subdomain),
    });

    if (tenant) {
      tenantId = tenant.id;

      // Now find the user within this tenant
      const user = await db.query.users.findFirst({
        where: (u, { and }) =>
          and(eq(u.clerkUserId, clerkUserId), eq(u.tenantId, tenantId!)),
      });

      if (user) {
        userId = user.id;
        userRole = user.role;
      }
    }
  }

  // If no subdomain or user not found, try to find user by Clerk ID
  if (!userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
      with: {
        tenant: true,
      },
    });

    if (user) {
      tenantId = user.tenantId;
      userId = user.id;
      userRole = user.role;
    }
  }

  // If still no tenant/user found, return error
  if (!tenantId || !userId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'No se encontró la organización o usuario',
        },
      },
      404
    );
  }

  // Set tenant and user context
  c.set('tenantId', tenantId);
  c.set('userId', userId);
  c.set('userRole', userRole || 'employee');

  await next();
});
