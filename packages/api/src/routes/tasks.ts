import { Hono } from 'hono';
import { eq, and, or, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../lib/db';
import { tasks, taskCompletions, areaUsers, checklistItems, problems } from '@qualyit/database/schema';
import {
  createTaskSchema,
  updateTaskSchema,
  paginationSchema,
} from '@qualyit/shared/validators';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

// Validation schemas for checklist and completion
const completeChecklistItemSchema = z.object({
  status: z.enum(['ok', 'problem']),
  problemReason: z.string().max(255).optional(),
});

const completeTaskSchema = z.object({
  status: z.enum(['ok', 'problem']),
  notes: z.string().max(1000).optional(),
  photoUrls: z.array(z.string().url()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  problemReason: z.enum(['no_time', 'no_supplies', 'equipment_broken', 'other']).optional(),
  problemDescription: z.string().max(1000).optional(),
});

export const tasksRoutes = new Hono<Env>();

// GET /api/tasks/today - Get today's tasks for current user (optimized for mobile)
// NOTE: This route MUST be defined BEFORE /:id to avoid conflict
tasksRoutes.get('/today', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const db = getDb();

  // Get start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get user's assigned areas (for non-admins)
  let userAreaIds: string[] = [];
  if (userRole !== 'admin' && userRole !== 'manager') {
    const userAreas = await db.query.areaUsers.findMany({
      where: and(eq(areaUsers.userId, userId), eq(areaUsers.tenantId, tenantId)),
      columns: { areaId: true },
    });
    userAreaIds = userAreas.map((ua) => ua.areaId);

    if (userAreaIds.length === 0) {
      return c.json({ success: true, data: [] });
    }
  }

  // Build conditions
  const conditions = [
    eq(tasks.tenantId, tenantId),
    or(
      // Due today
      and(gte(tasks.dueDate, today), lte(tasks.dueDate, tomorrow)),
      // Or pending/in_progress regardless of date
      and(
        or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress')),
        lte(tasks.dueDate, tomorrow)
      )
    )!,
  ];

  // Filter by user's areas or assigned directly
  if (userAreaIds.length > 0) {
    conditions.push(
      or(
        inArray(tasks.areaId, userAreaIds),
        eq(tasks.assignedToId, userId)
      )!
    );
  }

  const todaysTasks = await db.query.tasks.findMany({
    where: and(...conditions),
    with: {
      area: {
        columns: { id: true, name: true, code: true },
      },
    },
    orderBy: [asc(tasks.scheduledTime), desc(tasks.priority)],
  });

  // Get checklist items for all tasks
  const taskIds = todaysTasks.map((t) => t.id);
  const allChecklistItems = taskIds.length > 0
    ? await db.query.checklistItems.findMany({
        where: inArray(checklistItems.taskId, taskIds),
        orderBy: [asc(checklistItems.sortOrder)],
      })
    : [];

  // Combine tasks with their checklist items
  const tasksWithChecklists = todaysTasks.map((task) => ({
    ...task,
    checklistItems: allChecklistItems.filter((ci) => ci.taskId === task.id),
  }));

  return c.json({ success: true, data: tasksWithChecklists });
});

// GET /api/tasks - List tasks for current user
tasksRoutes.get('/', zValidator('query', paginationSchema.partial()), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const { page = 1, pageSize = 20 } = c.req.valid('query');
  const status = c.req.query('status');
  const areaId = c.req.query('areaId');
  const type = c.req.query('type');
  const db = getDb();

  // Get user's assigned areas (for non-admins)
  let userAreaIds: string[] = [];
  if (userRole !== 'admin' && userRole !== 'manager') {
    const userAreas = await db.query.areaUsers.findMany({
      where: and(eq(areaUsers.userId, userId), eq(areaUsers.tenantId, tenantId)),
      columns: { areaId: true },
    });
    userAreaIds = userAreas.map((ua) => ua.areaId);

    // If user has no areas assigned, return empty
    if (userAreaIds.length === 0) {
      return c.json({
        success: true,
        data: { items: [], page, pageSize, hasMore: false },
      });
    }
  }

  // Build where conditions
  const conditions = [eq(tasks.tenantId, tenantId)];

  // Filter by user's areas (for non-admins/managers)
  if (userAreaIds.length > 0) {
    conditions.push(inArray(tasks.areaId, userAreaIds));
  }

  // Filter by specific area if provided
  if (areaId) {
    conditions.push(eq(tasks.areaId, areaId));
  }

  // Filter by status
  if (status === 'pending') {
    conditions.push(
      or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress'))!
    );
  } else if (status === 'completed') {
    conditions.push(eq(tasks.status, 'completed'));
  } else if (status) {
    conditions.push(eq(tasks.status, status as 'pending' | 'in_progress' | 'completed' | 'cancelled'));
  }

  // Filter by type
  if (type) {
    conditions.push(eq(tasks.type, type as 'scheduled' | 'corrective' | 'preventive'));
  }

  const allTasks = await db.query.tasks.findMany({
    where: and(...conditions),
    with: {
      area: {
        columns: { id: true, name: true, code: true },
      },
    },
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: [asc(tasks.dueDate), desc(tasks.priority)],
  });

  return c.json({
    success: true,
    data: {
      items: allTasks,
      page,
      pageSize,
      hasMore: allTasks.length === pageSize,
    },
  });
});

// GET /api/tasks/:id - Get task details
tasksRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const taskId = c.req.param('id');
  const db = getDb();

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)),
    with: {
      area: {
        columns: { id: true, name: true, code: true },
      },
    },
  });

  if (!task) {
    throw Errors.notFound('Tarea');
  }

  // Get checklist items
  const taskChecklistItems = await db.query.checklistItems.findMany({
    where: eq(checklistItems.taskId, taskId),
    orderBy: [asc(checklistItems.sortOrder)],
  });

  // Get completions
  const completions = await db.query.taskCompletions.findMany({
    where: eq(taskCompletions.taskId, taskId),
    limit: 10,
    orderBy: [desc(taskCompletions.completedAt)],
    with: {
      user: {
        columns: { id: true, name: true },
      },
    },
  });

  return c.json({
    success: true,
    data: {
      ...task,
      checklistItems: taskChecklistItems,
      completions,
    },
  });
});

// POST /api/tasks - Create task (manager+ only)
tasksRoutes.post('/', zValidator('json', createTaskSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = c.req.valid('json');
  const db = getDb();

  // Only managers+ can create tasks
  if (userRole !== 'admin' && userRole !== 'manager') {
    throw Errors.forbidden('Solo gerentes o administradores pueden crear tareas');
  }

  const hasChecklist = body.checklistItems && body.checklistItems.length > 0;

  const [task] = await db
    .insert(tasks)
    .values({
      tenantId,
      areaId: body.areaId,
      title: body.title,
      description: body.description,
      type: body.type || 'scheduled',
      priority: body.priority || 'medium',
      assignedToId: body.assignedToId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      scheduledTime: body.scheduledTime,
      hasChecklist,
      createdById: userId,
    })
    .returning();

  // Create checklist items if provided
  if (hasChecklist) {
    await db.insert(checklistItems).values(
      body.checklistItems!.map((item, index) => ({
        tenantId,
        taskId: task.id,
        description: item.label,
        sortOrder: index,
      }))
    );
  }

  return c.json({ success: true, data: task }, 201);
});

// PATCH /api/tasks/:id - Update task
tasksRoutes.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const taskId = c.req.param('id');
  const body = c.req.valid('json');
  const db = getDb();

  // Only managers+ can update task details (except status)
  const isStatusOnly = Object.keys(body).length === 1 && 'status' in body;
  if (!isStatusOnly && userRole !== 'admin' && userRole !== 'manager') {
    throw Errors.forbidden('Solo gerentes o administradores pueden modificar tareas');
  }

  // Build update object with only valid task fields
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.areaId !== undefined) updateData.areaId = body.areaId;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.scheduledTime !== undefined) updateData.scheduledTime = body.scheduledTime;

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
    .returning();

  if (!updated) {
    throw Errors.notFound('Tarea');
  }

  return c.json({ success: true, data: updated });
});

// POST /api/tasks/:id/complete - Complete a task
tasksRoutes.post('/:id/complete', zValidator('json', completeTaskSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const taskId = c.req.param('id');
  const body = c.req.valid('json');
  const db = getDb();

  // Get the task
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)),
  });

  if (!task) {
    throw Errors.notFound('Tarea');
  }

  // Create completion record
  const [completion] = await db
    .insert(taskCompletions)
    .values({
      tenantId,
      taskId,
      userId,
      status: body.status,
      notes: body.notes,
    })
    .returning();

  // Update task status and completed fields
  const now = new Date();
  await db
    .update(tasks)
    .set({
      status: 'completed',
      completedAt: now,
      completedById: userId,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskId));

  // If problem was reported, auto-generate a problem record (T066)
  if (body.status === 'problem' && body.problemReason) {
    await db.insert(problems).values({
      tenantId,
      taskCompletionId: completion.id,
      reasonCategory: body.problemReason,
      description: body.problemDescription,
      status: 'open',
    });
  }

  return c.json({ success: true, data: completion }, 201);
});

// POST /api/tasks/:id/checklist/:itemId/complete - Complete a checklist item (T065)
tasksRoutes.post('/:id/checklist/:itemId/complete', zValidator('json', completeChecklistItemSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const taskId = c.req.param('id');
  const itemId = c.req.param('itemId');
  const body = c.req.valid('json');
  const db = getDb();

  // Verify task exists and belongs to tenant
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)),
  });

  if (!task) {
    throw Errors.notFound('Tarea');
  }

  // Update checklist item
  const [updated] = await db
    .update(checklistItems)
    .set({
      status: body.status,
      completedAt: new Date(),
      completedById: userId,
      problemReason: body.status === 'problem' ? body.problemReason : null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(checklistItems.id, itemId),
      eq(checklistItems.taskId, taskId),
      eq(checklistItems.tenantId, tenantId)
    ))
    .returning();

  if (!updated) {
    throw Errors.notFound('Item de checklist');
  }

  // Create a completion record for this checklist item
  await db.insert(taskCompletions).values({
    tenantId,
    taskId,
    checklistItemId: itemId,
    userId,
    status: body.status,
    notes: body.problemReason,
  });

  return c.json({ success: true, data: updated });
});

// POST /api/tasks/:id/reassign - Reassign task to another user (T082)
tasksRoutes.post(
  '/:id/reassign',
  zValidator('json', z.object({
    assignedToId: z.string().uuid(),
    reason: z.string().max(500).optional(),
  })),
  async (c) => {
    const tenantId = c.get('tenantId');
    const userRole = c.get('userRole');
    const taskId = c.req.param('id');
    const { assignedToId } = c.req.valid('json');
    const db = getDb();

    // Only supervisor+ can reassign
    if (!['admin', 'manager', 'supervisor'].includes(userRole)) {
      throw Errors.forbidden('No tiene permisos para reasignar tareas');
    }

    const [updated] = await db
      .update(tasks)
      .set({
        assignedToId,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw Errors.notFound('Tarea');
    }

    return c.json({ success: true, data: updated });
  }
);

// GET /api/tasks/:id/history - Get task completion history (T083)
tasksRoutes.get('/:id/history', async (c) => {
  const tenantId = c.get('tenantId');
  const taskId = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '50');
  const db = getDb();

  // Get all completions for this task
  const history = await db.query.taskCompletions.findMany({
    where: and(
      eq(taskCompletions.taskId, taskId),
      eq(taskCompletions.tenantId, tenantId)
    ),
    with: {
      user: {
        columns: { id: true, name: true, avatarUrl: true },
      },
      checklistItem: {
        columns: { id: true, description: true },
      },
    },
    orderBy: [desc(taskCompletions.completedAt)],
    limit,
  });

  return c.json({ success: true, data: history });
});

// DELETE /api/tasks/:id - Delete task (admin only)
tasksRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const taskId = c.req.param('id');
  const db = getDb();

  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden eliminar tareas');
  }

  const [deleted] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
    .returning({ id: tasks.id });

  if (!deleted) {
    throw Errors.notFound('Tarea');
  }

  return c.json({ success: true, data: { id: taskId } });
});
