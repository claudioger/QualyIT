import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../lib/db';
import { tenants, users } from '@qualyit/database/schema';
import { createTenantSchema, updateTenantSchema } from '@qualyit/shared/validators';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

export const tenantsRoutes = new Hono<Env>();

// GET /api/tenants/me - Get current tenant
tenantsRoutes.get('/me', async (c) => {
  const tenantId = c.get('tenantId');
  const db = getDb();

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      id: true,
      name: true,
      subdomain: true,
      plan: true,
      settings: true,
      createdAt: true,
    },
  });

  if (!tenant) {
    throw Errors.notFound('Organización');
  }

  return c.json({
    success: true,
    data: tenant,
  });
});

// PATCH /api/tenants/me - Update current tenant
tenantsRoutes.patch('/me', zValidator('json', updateTenantSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const body = c.req.valid('json');
  const db = getDb();

  // Only admins can update tenant
  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden modificar la organización');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    updateData.name = body.name;
  }
  if (body.settings !== undefined) {
    updateData.settings = body.settings;
  }

  const [updated] = await db
    .update(tenants)
    .set(updateData)
    .where(eq(tenants.id, tenantId))
    .returning();

  return c.json({
    success: true,
    data: updated,
  });
});

// POST /api/tenants - Create new tenant (used during onboarding)
tenantsRoutes.post('/', zValidator('json', createTenantSchema), async (c) => {
  const clerkUserId = c.get('clerkUserId');
  const body = c.req.valid('json');
  const db = getDb();

  // Check if subdomain already exists
  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.subdomain, body.subdomain),
  });

  if (existing) {
    throw Errors.conflict('El subdominio ya está en uso');
  }

  // Create tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: body.name,
      slug: body.subdomain,
      subdomain: body.subdomain,
      plan: body.plan || 'free',
      settings: body.settings || {
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-AR',
      },
    })
    .returning();

  // Create admin user for this tenant
  await db.insert(users).values({
    tenantId: tenant.id,
    clerkUserId,
    email: '', // Will be updated by Clerk webhook
    name: '', // Will be updated by Clerk webhook
    role: 'admin',
    mustChangePassword: false,
  });

  return c.json(
    {
      success: true,
      data: tenant,
    },
    201
  );
});

// GET /api/tenants/check-subdomain - Check if subdomain is available
tenantsRoutes.get('/check-subdomain', async (c) => {
  const subdomain = c.req.query('subdomain');
  const db = getDb();

  if (!subdomain) {
    throw Errors.badRequest('Se requiere subdomain');
  }

  // Validate subdomain format
  if (!/^[a-z0-9-]+$/.test(subdomain) || subdomain.length < 3) {
    return c.json({
      success: true,
      data: {
        available: false,
        reason: 'El subdominio debe tener al menos 3 caracteres y solo contener letras minúsculas, números y guiones',
      },
    });
  }

  // Reserved subdomains
  const reserved = ['www', 'api', 'app', 'admin', 'dashboard', 'demo', 'test', 'staging', 'dev'];
  if (reserved.includes(subdomain)) {
    return c.json({
      success: true,
      data: {
        available: false,
        reason: 'Este subdominio está reservado',
      },
    });
  }

  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.subdomain, subdomain),
  });

  return c.json({
    success: true,
    data: {
      available: !existing,
    },
  });
});
