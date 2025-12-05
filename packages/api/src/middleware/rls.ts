import { createMiddleware } from 'hono/factory';
import { sql } from 'drizzle-orm';
import { getDb } from '../lib/db';
import type { Env } from '../index';

/**
 * Row-Level Security (RLS) context middleware
 * Sets the current tenant ID in the PostgreSQL session
 * This enables RLS policies to filter data automatically
 */
export const rlsMiddleware = createMiddleware<Env>(async (c, next) => {
  // Skip for health check
  if (c.req.path === '/api/health') {
    return next();
  }

  const tenantId = c.get('tenantId');

  if (!tenantId) {
    return c.json(
      {
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Contexto de tenant requerido',
        },
      },
      400
    );
  }

  const db = getDb();

  try {
    // Set the tenant context for RLS
    // Using SET LOCAL ensures this only applies to the current transaction
    await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);

    await next();
  } catch (error) {
    console.error('RLS context error:', error);
    return c.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al establecer contexto de seguridad',
        },
      },
      500
    );
  }
});

/**
 * Helper to set RLS context in raw SQL queries
 * Use this when you need to run queries outside of the middleware chain
 */
export async function setRlsContext(tenantId: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
}
