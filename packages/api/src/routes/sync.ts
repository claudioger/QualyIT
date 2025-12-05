import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gt, or, inArray } from 'drizzle-orm';
import { getDb } from '../lib/db';
import {
  tasks,
  taskCompletions,
  checklistItems,
  areas,
  areaUsers,
  problems,
} from '@qualyit/database/schema';
import type { Env } from '../index';

// Validation schemas
const syncPullSchema = z.object({
  lastSyncedAt: z.string().datetime().optional(),
  entityTypes: z.array(z.enum(['tasks', 'areas', 'completions'])).optional(),
});

const syncPushSchema = z.object({
  completions: z
    .array(
      z.object({
        offlineId: z.string(),
        taskId: z.string().uuid(),
        checklistItemId: z.string().uuid().optional(),
        status: z.enum(['ok', 'problem']),
        notes: z.string().optional(),
        completedAt: z.string().datetime(),
      })
    )
    .optional(),
  checklistUpdates: z
    .array(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['ok', 'problem', 'pending']),
        problemReason: z.string().optional(),
        completedAt: z.string().datetime().optional(),
      })
    )
    .optional(),
});

export const syncRoutes = new Hono<Env>();

// POST /api/sync/pull - Get changes since last sync (T068)
syncRoutes.post('/pull', zValidator('json', syncPullSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const body = c.req.valid('json');
  const db = getDb();

  const lastSyncedAt = body.lastSyncedAt ? new Date(body.lastSyncedAt) : null;
  const entityTypes = body.entityTypes || ['tasks', 'areas', 'completions'];

  // Get user's areas
  let userAreaIds: string[] = [];
  if (userRole !== 'admin' && userRole !== 'manager') {
    const userAreas = await db.query.areaUsers.findMany({
      where: and(eq(areaUsers.userId, userId), eq(areaUsers.tenantId, tenantId)),
      columns: { areaId: true },
    });
    userAreaIds = userAreas.map((ua) => ua.areaId);
  }

  const response: {
    tasks?: unknown[];
    areas?: unknown[];
    completions?: unknown[];
    checklistItems?: unknown[];
    syncedAt: string;
  } = {
    syncedAt: new Date().toISOString(),
  };

  // Pull tasks
  if (entityTypes.includes('tasks')) {
    const taskConditions = [eq(tasks.tenantId, tenantId)];

    if (lastSyncedAt) {
      taskConditions.push(gt(tasks.updatedAt, lastSyncedAt));
    }

    // Filter by user areas for non-admins
    if (userAreaIds.length > 0) {
      taskConditions.push(
        or(inArray(tasks.areaId, userAreaIds), eq(tasks.assignedToId, userId))!
      );
    }

    const updatedTasks = await db.query.tasks.findMany({
      where: and(...taskConditions),
      with: {
        area: {
          columns: { id: true, name: true, code: true },
        },
      },
    });

    // Get checklist items for the tasks
    const taskIds = updatedTasks.map((t) => t.id);
    const taskChecklistItems = taskIds.length > 0
      ? await db.query.checklistItems.findMany({
          where: inArray(checklistItems.taskId, taskIds),
        })
      : [];

    // Combine tasks with checklist items
    response.tasks = updatedTasks.map((task) => ({
      ...task,
      checklistItems: taskChecklistItems.filter((ci) => ci.taskId === task.id),
    }));
  }

  // Pull areas
  if (entityTypes.includes('areas')) {
    const areaConditions = [eq(areas.tenantId, tenantId)];

    if (lastSyncedAt) {
      areaConditions.push(gt(areas.updatedAt, lastSyncedAt));
    }

    if (userAreaIds.length > 0) {
      areaConditions.push(inArray(areas.id, userAreaIds));
    }

    const updatedAreas = await db.query.areas.findMany({
      where: and(...areaConditions),
    });

    response.areas = updatedAreas;
  }

  // Pull completions
  if (entityTypes.includes('completions')) {
    const completionConditions = [eq(taskCompletions.tenantId, tenantId)];

    if (lastSyncedAt) {
      completionConditions.push(gt(taskCompletions.completedAt, lastSyncedAt));
    }

    const updatedCompletions = await db.query.taskCompletions.findMany({
      where: and(...completionConditions),
      limit: 100, // Limit to prevent huge responses
    });

    response.completions = updatedCompletions;
  }

  return c.json({ success: true, data: response });
});

// POST /api/sync/push - Push offline changes to server (T068)
syncRoutes.post('/push', zValidator('json', syncPushSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = c.req.valid('json');
  const db = getDb();

  const results: {
    completions: { offlineId: string; serverId: string; status: 'created' | 'duplicate' }[];
    checklistUpdates: { id: string; status: 'updated' | 'not_found' }[];
    errors: { offlineId?: string; id?: string; error: string }[];
  } = {
    completions: [],
    checklistUpdates: [],
    errors: [],
  };

  // Process completions
  if (body.completions && body.completions.length > 0) {
    for (const completion of body.completions) {
      try {
        // Check if already synced (by offlineId)
        const existing = await db.query.taskCompletions.findFirst({
          where: and(
            eq(taskCompletions.offlineId, completion.offlineId),
            eq(taskCompletions.tenantId, tenantId)
          ),
        });

        if (existing) {
          results.completions.push({
            offlineId: completion.offlineId,
            serverId: existing.id,
            status: 'duplicate',
          });
          continue;
        }

        // Create new completion
        const [created] = await db
          .insert(taskCompletions)
          .values({
            tenantId,
            taskId: completion.taskId,
            checklistItemId: completion.checklistItemId,
            userId,
            status: completion.status,
            notes: completion.notes,
            completedAt: new Date(completion.completedAt),
            syncedAt: new Date(),
            offlineId: completion.offlineId,
          })
          .returning();

        results.completions.push({
          offlineId: completion.offlineId,
          serverId: created.id,
          status: 'created',
        });

        // Update task status if this is a task completion (not checklist item)
        if (!completion.checklistItemId) {
          await db
            .update(tasks)
            .set({
              status: 'completed',
              completedAt: new Date(completion.completedAt),
              completedById: userId,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, completion.taskId));
        }

        // If problem, create problem record
        if (completion.status === 'problem') {
          await db.insert(problems).values({
            tenantId,
            taskCompletionId: created.id,
            reasonCategory: 'other',
            description: completion.notes,
            status: 'open',
          });
        }
      } catch (error) {
        results.errors.push({
          offlineId: completion.offlineId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }
  }

  // Process checklist updates
  if (body.checklistUpdates && body.checklistUpdates.length > 0) {
    for (const update of body.checklistUpdates) {
      try {
        const [updated] = await db
          .update(checklistItems)
          .set({
            status: update.status,
            completedAt: update.completedAt ? new Date(update.completedAt) : null,
            completedById: update.status !== 'pending' ? userId : null,
            problemReason: update.problemReason,
            updatedAt: new Date(),
          })
          .where(and(eq(checklistItems.id, update.id), eq(checklistItems.tenantId, tenantId)))
          .returning();

        results.checklistUpdates.push({
          id: update.id,
          status: updated ? 'updated' : 'not_found',
        });
      } catch (error) {
        results.errors.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }
  }

  return c.json({
    success: true,
    data: {
      ...results,
      syncedAt: new Date().toISOString(),
    },
  });
});

// GET /api/sync/status - Check sync status for current user
syncRoutes.get('/status', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const db = getDb();

  // Get count of pending items that need sync
  const pendingTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.tenantId, tenantId),
      or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId)),
      or(eq(tasks.status, 'pending'), eq(tasks.status, 'in_progress'))
    ),
    columns: { id: true },
  });

  return c.json({
    success: true,
    data: {
      pendingTaskCount: pendingTasks.length,
      serverTime: new Date().toISOString(),
    },
  });
});
