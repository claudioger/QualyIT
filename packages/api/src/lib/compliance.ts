/**
 * Compliance calculation logic (T081)
 * Calculates task completion rates and compliance scores for areas
 */

import { eq, and, gte, lte, sql, count, desc } from 'drizzle-orm';
import { getDb } from './db';
import { tasks, taskCompletions, areas, problems } from '@qualyit/database/schema';

export interface ComplianceMetrics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  withProblems: number;
  complianceRate: number; // 0-100
  onTimeRate: number; // 0-100
}

export interface AreaStats {
  areaId: string;
  areaName: string;
  areaCode: string | null;
  metrics: ComplianceMetrics;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface Alert {
  id: string;
  type: 'overdue' | 'problem' | 'low_compliance' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  areaId: string;
  areaName: string;
  taskId?: string;
  createdAt: Date;
}

/**
 * Calculate compliance metrics for a specific area within a date range
 */
export async function calculateAreaCompliance(
  tenantId: string,
  areaId: string,
  startDate: Date,
  endDate: Date
): Promise<ComplianceMetrics> {
  const db = getDb();

  // Get all tasks for the area in the date range
  const areaTasksResult = await db
    .select({
      total: count(),
      completed: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'completed')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} IN ('pending', 'in_progress'))`,
      overdue: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} IN ('pending', 'in_progress') AND ${tasks.dueDate} < NOW())`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.areaId, areaId),
        gte(tasks.dueDate, startDate),
        lte(tasks.dueDate, endDate)
      )
    );

  const taskStats = areaTasksResult[0] || { total: 0, completed: 0, pending: 0, overdue: 0 };

  // Get count of completed with problems
  const problemsResult = await db
    .select({ count: count() })
    .from(taskCompletions)
    .innerJoin(tasks, eq(taskCompletions.taskId, tasks.id))
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.areaId, areaId),
        eq(taskCompletions.status, 'problem'),
        gte(taskCompletions.completedAt, startDate),
        lte(taskCompletions.completedAt, endDate)
      )
    );

  const withProblems = problemsResult[0]?.count || 0;

  // Calculate rates
  const total = Number(taskStats.total) || 0;
  const completed = Number(taskStats.completed) || 0;
  const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 100;

  // On-time rate: completed tasks that were completed before or on due date
  const onTimeResult = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.areaId, areaId),
        eq(tasks.status, 'completed'),
        gte(tasks.dueDate, startDate),
        lte(tasks.dueDate, endDate),
        sql`${tasks.completedAt} <= ${tasks.dueDate} + interval '1 day'`
      )
    );

  const onTimeCount = onTimeResult[0]?.count || 0;
  const onTimeRate = completed > 0 ? Math.round((Number(onTimeCount) / completed) * 100) : 100;

  return {
    total,
    completed,
    pending: Number(taskStats.pending) || 0,
    overdue: Number(taskStats.overdue) || 0,
    withProblems: Number(withProblems),
    complianceRate,
    onTimeRate,
  };
}

/**
 * Get stats for all areas in a tenant
 */
export async function getAreasStats(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<AreaStats[]> {
  const db = getDb();

  // Get all active areas
  const allAreas = await db.query.areas.findMany({
    where: and(eq(areas.tenantId, tenantId), eq(areas.isActive, true)),
    columns: { id: true, name: true, code: true },
  });

  // Calculate previous period for trend
  const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - periodDays);
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);

  const results: AreaStats[] = [];

  for (const area of allAreas) {
    const currentMetrics = await calculateAreaCompliance(tenantId, area.id, startDate, endDate);
    const previousMetrics = await calculateAreaCompliance(tenantId, area.id, prevStartDate, prevEndDate);

    const trendDiff = currentMetrics.complianceRate - previousMetrics.complianceRate;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (trendDiff > 2) trend = 'up';
    else if (trendDiff < -2) trend = 'down';

    results.push({
      areaId: area.id,
      areaName: area.name,
      areaCode: area.code,
      metrics: currentMetrics,
      trend,
      trendPercentage: Math.abs(trendDiff),
    });
  }

  return results;
}

/**
 * Get alerts for an area (overdue tasks, problems, low compliance)
 */
export async function getAreaAlerts(
  tenantId: string,
  areaId?: string,
  limit: number = 20
): Promise<Alert[]> {
  const db = getDb();
  const alerts: Alert[] = [];
  const now = new Date();

  // Build area condition
  const areaCondition = areaId ? eq(tasks.areaId, areaId) : undefined;

  // Get overdue tasks
  const overdueTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.tenantId, tenantId),
      areaCondition,
      sql`${tasks.status} IN ('pending', 'in_progress')`,
      sql`${tasks.dueDate} < NOW()`
    ),
    with: {
      area: { columns: { id: true, name: true } },
    },
    limit: Math.ceil(limit / 2),
    orderBy: [desc(tasks.dueDate)],
  });

  for (const task of overdueTasks) {
    const hoursOverdue = Math.floor((now.getTime() - (task.dueDate?.getTime() || 0)) / (1000 * 60 * 60));
    let severity: Alert['severity'] = 'low';
    if (hoursOverdue > 48) severity = 'critical';
    else if (hoursOverdue > 24) severity = 'high';
    else if (hoursOverdue > 4) severity = 'medium';

    alerts.push({
      id: `overdue-${task.id}`,
      type: 'overdue',
      severity,
      title: `Tarea vencida: ${task.title}`,
      description: `Vencida hace ${hoursOverdue} horas`,
      areaId: task.areaId,
      areaName: task.area?.name || 'Sin área',
      taskId: task.id,
      createdAt: task.dueDate || now,
    });
  }

  // Get recent problems
  const recentProblems = await db.query.problems.findMany({
    where: and(
      eq(problems.tenantId, tenantId),
      eq(problems.status, 'open')
    ),
    with: {
      taskCompletion: {
        with: {
          task: {
            with: {
              area: { columns: { id: true, name: true } },
            },
          },
        },
      },
    },
    limit: Math.ceil(limit / 2),
    orderBy: [desc(problems.createdAt)],
  });

  for (const problem of recentProblems) {
    const taskData = problem.taskCompletion?.task;
    if (areaId && taskData?.areaId !== areaId) continue;

    let severity: Alert['severity'] = 'medium';
    if (problem.reasonCategory === 'equipment_broken') severity = 'high';

    alerts.push({
      id: `problem-${problem.id}`,
      type: 'problem',
      severity,
      title: `Problema reportado`,
      description: problem.description || `Motivo: ${problem.reasonCategory}`,
      areaId: taskData?.areaId || '',
      areaName: taskData?.area?.name || 'Sin área',
      taskId: taskData?.id,
      createdAt: problem.createdAt,
    });
  }

  // Sort by severity and date
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return alerts.slice(0, limit);
}

/**
 * Calculate trend data for charts (daily compliance over time)
 */
export async function getComplianceTrend(
  tenantId: string,
  areaId: string | null,
  days: number = 30
): Promise<Array<{ date: string; compliance: number; tasks: number }>> {
  const db = getDb();
  const results: Array<{ date: string; compliance: number; tasks: number }> = [];

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(endDate);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const conditions = [
      eq(tasks.tenantId, tenantId),
      gte(tasks.dueDate, dayStart),
      lte(tasks.dueDate, dayEnd),
    ];

    if (areaId) {
      conditions.push(eq(tasks.areaId, areaId));
    }

    const dayStats = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'completed')`,
      })
      .from(tasks)
      .where(and(...conditions));

    const total = Number(dayStats[0]?.total) || 0;
    const completed = Number(dayStats[0]?.completed) || 0;
    const compliance = total > 0 ? Math.round((completed / total) * 100) : 100;

    results.push({
      date: dayStart.toISOString().split('T')[0],
      compliance,
      tasks: total,
    });
  }

  return results;
}
