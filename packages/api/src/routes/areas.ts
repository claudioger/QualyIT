import { Hono } from 'hono';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../lib/db';
import { areas, areaUsers } from '@qualyit/database/schema';
import { createAreaSchema, updateAreaSchema } from '@qualyit/shared/validators';
import { Errors } from '../middleware/error';
import { calculateAreaCompliance, getAreaAlerts, getComplianceTrend } from '../lib/compliance';
import type { Env } from '../index';

export const areasRoutes = new Hono<Env>();

// GET /api/areas - List all areas (flat or tree)
areasRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  const format = c.req.query('format') || 'flat'; // 'flat' or 'tree'
  const db = getDb();

  const allAreas = await db.query.areas.findMany({
    where: and(eq(areas.tenantId, tenantId), eq(areas.isActive, true)),
    with: {
      responsible: {
        columns: { id: true, name: true, avatarUrl: true },
      },
      backupResponsible: {
        columns: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: [asc(areas.sortOrder), asc(areas.name)],
  });

  if (format === 'tree') {
    // Build tree structure
    const tree = buildAreaTree(allAreas);
    return c.json({ success: true, data: tree });
  }

  return c.json({ success: true, data: allAreas });
});

// GET /api/areas/:id - Get single area
areasRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const areaId = c.req.param('id');
  const db = getDb();

  const area = await db.query.areas.findFirst({
    where: and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)),
    with: {
      responsible: {
        columns: { id: true, name: true, email: true, avatarUrl: true },
      },
      backupResponsible: {
        columns: { id: true, name: true, email: true, avatarUrl: true },
      },
      parent: {
        columns: { id: true, name: true },
      },
      children: {
        columns: { id: true, name: true },
        where: eq(areas.isActive, true),
      },
    },
  });

  if (!area) {
    throw Errors.notFound('Área');
  }

  return c.json({ success: true, data: area });
});

// POST /api/areas - Create area
areasRoutes.post('/', zValidator('json', createAreaSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const body = c.req.valid('json');
  const db = getDb();

  // Only admin/manager can create areas
  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para crear áreas');
  }

  // Validate parent exists if provided
  if (body.parentId) {
    const parent = await db.query.areas.findFirst({
      where: and(eq(areas.id, body.parentId), eq(areas.tenantId, tenantId)),
    });
    if (!parent) {
      throw Errors.badRequest('Área padre no encontrada');
    }
  }

  const [area] = await db
    .insert(areas)
    .values({
      tenantId,
      name: body.name,
      code: body.code,
      parentId: body.parentId,
      responsibleId: body.responsibleId,
      backupResponsibleId: body.backupResponsibleId,
      settings: body.settings || {},
      sortOrder: body.sortOrder || 0,
    })
    .returning();

  return c.json({ success: true, data: area }, 201);
});

// PATCH /api/areas/:id - Update area
areasRoutes.patch('/:id', zValidator('json', updateAreaSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const areaId = c.req.param('id');
  const body = c.req.valid('json');
  const db = getDb();

  // Only admin/manager can update areas
  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para modificar áreas');
  }

  // Check area exists
  const existing = await db.query.areas.findFirst({
    where: and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)),
  });

  if (!existing) {
    throw Errors.notFound('Área');
  }

  // Prevent circular parent reference
  if (body.parentId === areaId) {
    throw Errors.badRequest('Un área no puede ser su propio padre');
  }

  const [updated] = await db
    .update(areas)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)))
    .returning();

  return c.json({ success: true, data: updated });
});

// DELETE /api/areas/:id - Soft delete area
areasRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const areaId = c.req.param('id');
  const db = getDb();

  // Only admin can delete areas
  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden eliminar áreas');
  }

  // Check if area has active children
  const children = await db.query.areas.findFirst({
    where: and(
      eq(areas.parentId, areaId),
      eq(areas.tenantId, tenantId),
      eq(areas.isActive, true)
    ),
  });

  if (children) {
    throw Errors.badRequest('No se puede eliminar un área con sub-áreas activas');
  }

  const [deleted] = await db
    .update(areas)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)))
    .returning();

  if (!deleted) {
    throw Errors.notFound('Área');
  }

  return c.json({ success: true, data: { id: areaId } });
});

// POST /api/areas/:id/users - Assign users to area
areasRoutes.post(
  '/:id/users',
  zValidator('json', z.object({ userIds: z.array(z.string().uuid()) })),
  async (c) => {
    const tenantId = c.get('tenantId');
    const userRole = c.get('userRole');
    const areaId = c.req.param('id');
    const { userIds } = c.req.valid('json');
    const db = getDb();

    if (!['admin', 'manager', 'supervisor'].includes(userRole)) {
      throw Errors.forbidden('No tiene permisos para asignar usuarios');
    }

    // Verify area exists
    const area = await db.query.areas.findFirst({
      where: and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)),
    });

    if (!area) {
      throw Errors.notFound('Área');
    }

    // Insert user assignments (ignore duplicates)
    const values = userIds.map((userId) => ({
      tenantId,
      areaId,
      userId,
    }));

    await db.insert(areaUsers).values(values).onConflictDoNothing();

    return c.json({ success: true, data: { areaId, userIds } });
  }
);

// DELETE /api/areas/:id/users/:userId - Remove user from area
areasRoutes.delete('/:id/users/:userId', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const areaId = c.req.param('id');
  const userId = c.req.param('userId');
  const db = getDb();

  if (!['admin', 'manager', 'supervisor'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para remover usuarios');
  }

  await db
    .delete(areaUsers)
    .where(
      and(
        eq(areaUsers.areaId, areaId),
        eq(areaUsers.userId, userId),
        eq(areaUsers.tenantId, tenantId)
      )
    );

  return c.json({ success: true, data: { areaId, userId } });
});

// GET /api/areas/:id/stats - Get area statistics (T080)
areasRoutes.get('/:id/stats', async (c) => {
  const tenantId = c.get('tenantId');
  const areaId = c.req.param('id');
  const period = c.req.query('period') || '7d'; // 7d, 30d, 90d
  const db = getDb();

  // Verify area exists
  const area = await db.query.areas.findFirst({
    where: and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)),
    columns: { id: true, name: true, code: true },
  });

  if (!area) {
    throw Errors.notFound('Área');
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  switch (period) {
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default: // 7d
      startDate.setDate(startDate.getDate() - 7);
  }

  const metrics = await calculateAreaCompliance(tenantId, areaId, startDate, endDate);
  const alerts = await getAreaAlerts(tenantId, areaId, 10);
  const trend = await getComplianceTrend(tenantId, areaId, period === '7d' ? 7 : period === '30d' ? 30 : 90);

  return c.json({
    success: true,
    data: {
      area,
      period,
      metrics,
      alerts,
      trend,
    },
  });
});

// GET /api/areas/:id/alerts - Get alerts for area
areasRoutes.get('/:id/alerts', async (c) => {
  const tenantId = c.get('tenantId');
  const areaId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '20');
  const db = getDb();

  // Verify area exists
  const area = await db.query.areas.findFirst({
    where: and(eq(areas.id, areaId), eq(areas.tenantId, tenantId)),
  });

  if (!area) {
    throw Errors.notFound('Área');
  }

  const alerts = await getAreaAlerts(tenantId, areaId, limit);

  return c.json({ success: true, data: alerts });
});

// Helper function to build tree structure
interface AreaNode {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  children: AreaNode[];
  [key: string]: unknown;
}

function buildAreaTree(flatAreas: Array<Record<string, unknown>>): AreaNode[] {
  const map = new Map<string, AreaNode>();
  const roots: AreaNode[] = [];

  // Create nodes
  for (const area of flatAreas) {
    const node: AreaNode = {
      id: area.id as string,
      name: area.name as string,
      code: area.code as string | null,
      parentId: area.parentId as string | null,
      children: [],
      ...area,
    };
    map.set(area.id as string, node);
  }

  // Build tree
  for (const area of flatAreas) {
    const node = map.get(area.id as string)!;
    if (area.parentId && map.has(area.parentId as string)) {
      map.get(area.parentId as string)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
