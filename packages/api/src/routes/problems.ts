import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../lib/db';
import { problems, tasks } from '@qualyit/database/schema';
import { paginationSchema } from '@qualyit/shared/validators';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

const updateProblemSchema = z.object({
  description: z.string().max(1000).optional(),
  status: z.enum(['open', 'assigned', 'resolved']).optional(),
  correctiveTaskId: z.string().uuid().optional().nullable(),
});

export const problemsRoutes = new Hono<Env>();

// GET /api/problems - List problems
problemsRoutes.get('/', zValidator('query', paginationSchema.partial()), async (c) => {
  const tenantId = c.get('tenantId');
  const { page = 1, pageSize = 20 } = c.req.valid('query');
  const status = c.req.query('status');
  const db = getDb();

  const conditions = [eq(problems.tenantId, tenantId)];

  if (status) {
    conditions.push(eq(problems.status, status as 'open' | 'assigned' | 'resolved'));
  }

  const allProblems = await db.query.problems.findMany({
    where: and(...conditions),
    with: {
      taskCompletion: {
        with: {
          task: {
            columns: { id: true, title: true },
            with: {
              area: {
                columns: { id: true, name: true, code: true },
              },
            },
          },
          user: {
            columns: { id: true, name: true },
          },
        },
      },
      correctiveTask: {
        columns: { id: true, title: true, status: true },
      },
      resolvedBy: {
        columns: { id: true, name: true },
      },
    },
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: [desc(problems.createdAt)],
  });

  return c.json({
    success: true,
    data: {
      items: allProblems,
      page,
      pageSize,
      hasMore: allProblems.length === pageSize,
    },
  });
});

// GET /api/problems/:id - Get problem details
problemsRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const problemId = c.req.param('id');
  const db = getDb();

  const problem = await db.query.problems.findFirst({
    where: and(eq(problems.id, problemId), eq(problems.tenantId, tenantId)),
    with: {
      taskCompletion: {
        with: {
          task: {
            with: {
              area: true,
            },
          },
          user: {
            columns: { id: true, name: true, email: true },
          },
        },
      },
      correctiveTask: true,
      resolvedBy: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!problem) {
    throw Errors.notFound('Problema');
  }

  return c.json({ success: true, data: problem });
});

// PATCH /api/problems/:id - Update problem
problemsRoutes.patch('/:id', zValidator('json', updateProblemSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const problemId = c.req.param('id');
  const body = c.req.valid('json');
  const db = getDb();

  // Only supervisors+ can update problems
  if (userRole === 'employee') {
    throw Errors.forbidden('No tiene permisos para modificar problemas');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.description !== undefined) updateData.description = body.description;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.correctiveTaskId !== undefined) updateData.correctiveTaskId = body.correctiveTaskId;

  // Set resolved timestamp and user if status changed to resolved
  if (body.status === 'resolved') {
    updateData.resolvedAt = new Date();
    updateData.resolvedById = userId;
  }

  const [updated] = await db
    .update(problems)
    .set(updateData)
    .where(and(eq(problems.id, problemId), eq(problems.tenantId, tenantId)))
    .returning();

  if (!updated) {
    throw Errors.notFound('Problema');
  }

  return c.json({ success: true, data: updated });
});

// POST /api/problems/:id/create-corrective - Create corrective task for problem
problemsRoutes.post('/:id/create-corrective', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const problemId = c.req.param('id');
  const db = getDb();

  // Only supervisors+ can create corrective tasks
  if (userRole === 'employee') {
    throw Errors.forbidden('No tiene permisos para crear tareas correctivas');
  }

  // Get the problem with its task completion
  const problem = await db.query.problems.findFirst({
    where: and(eq(problems.id, problemId), eq(problems.tenantId, tenantId)),
    with: {
      taskCompletion: {
        with: {
          task: true,
        },
      },
    },
  });

  if (!problem) {
    throw Errors.notFound('Problema');
  }

  // Create corrective task
  const originalTask = problem.taskCompletion?.task;
  const reasonLabels: Record<string, string> = {
    no_time: 'Falta de tiempo',
    no_supplies: 'Falta de suministros',
    equipment_broken: 'Equipo averiado',
    other: 'Otro motivo',
  };

  const [correctiveTask] = await db
    .insert(tasks)
    .values({
      tenantId,
      areaId: originalTask?.areaId!,
      title: `[Correctiva] ${originalTask?.title || 'Resolver problema'}`,
      description: `Tarea correctiva para problema: ${reasonLabels[problem.reasonCategory] || problem.reasonCategory}. ${problem.description || ''}`,
      type: 'corrective',
      priority: 'high',
      createdById: userId,
      parentTaskId: originalTask?.id,
    })
    .returning();

  // Update problem with corrective task
  await db
    .update(problems)
    .set({
      correctiveTaskId: correctiveTask.id,
      status: 'assigned',
      updatedAt: new Date(),
    })
    .where(eq(problems.id, problemId));

  return c.json({ success: true, data: correctiveTask }, 201);
});

// DELETE /api/problems/:id - Delete problem (admin only)
problemsRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const problemId = c.req.param('id');
  const db = getDb();

  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden eliminar problemas');
  }

  const [deleted] = await db
    .delete(problems)
    .where(and(eq(problems.id, problemId), eq(problems.tenantId, tenantId)))
    .returning({ id: problems.id });

  if (!deleted) {
    throw Errors.notFound('Problema');
  }

  return c.json({ success: true, data: { id: problemId } });
});
