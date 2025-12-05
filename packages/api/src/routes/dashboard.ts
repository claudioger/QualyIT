/**
 * Dashboard routes (T108-T110)
 * Provides aggregated metrics for manager dashboard
 */

import { Hono } from 'hono';
import { eq, and, sql, count, desc, gte, lte } from 'drizzle-orm';
import { getDb } from '../lib/db';
import { tasks, areas, problems, taskCompletions } from '@qualyit/database/schema';
import { getAreasStats, getAreaAlerts, getComplianceTrend } from '../lib/compliance';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

export const dashboardRoutes = new Hono<Env>();

// GET /api/dashboard - Manager dashboard overview (T108)
dashboardRoutes.get('/', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');

  // Only manager+ can view dashboard
  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para ver el dashboard');
  }

  // Default to last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  // Get areas stats
  const areasStats = await getAreasStats(tenantId, startDate, endDate);

  // Calculate totals
  const totals = areasStats.reduce(
    (acc, area) => ({
      total: acc.total + area.metrics.total,
      completed: acc.completed + area.metrics.completed,
      pending: acc.pending + area.metrics.pending,
      overdue: acc.overdue + area.metrics.overdue,
      withProblems: acc.withProblems + area.metrics.withProblems,
    }),
    { total: 0, completed: 0, pending: 0, overdue: 0, withProblems: 0 }
  );

  const overallCompliance = totals.total > 0
    ? Math.round((totals.completed / totals.total) * 100)
    : 100;

  // Get critical alerts (all areas)
  const criticalAlerts = await getAreaAlerts(tenantId, undefined, 10);

  return c.json({
    success: true,
    data: {
      overview: {
        ...totals,
        complianceRate: overallCompliance,
      },
      areas: areasStats.sort((a, b) => a.metrics.complianceRate - b.metrics.complianceRate),
      criticalAlerts: criticalAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high'),
    },
  });
});

// GET /api/dashboard/trends - Compliance trends over time (T109)
dashboardRoutes.get('/trends', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const days = parseInt(c.req.query('days') || '30');
  const areaId = c.req.query('areaId');

  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para ver tendencias');
  }

  const trend = await getComplianceTrend(tenantId, areaId || null, Math.min(days, 90));

  return c.json({ success: true, data: trend });
});

// GET /api/dashboard/alerts - All critical alerts (T110)
dashboardRoutes.get('/alerts', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const severity = c.req.query('severity'); // 'critical', 'high', etc.
  const limit = parseInt(c.req.query('limit') || '50');

  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para ver alertas');
  }

  let alerts = await getAreaAlerts(tenantId, undefined, limit);

  // Filter by severity if requested
  if (severity) {
    alerts = alerts.filter((a) => a.severity === severity);
  }

  return c.json({ success: true, data: alerts });
});

// GET /api/dashboard/problems - Recent problems summary
dashboardRoutes.get('/problems', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const db = getDb();

  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para ver problemas');
  }

  // Get problem counts by category
  const problemStats = await db
    .select({
      category: problems.reasonCategory,
      count: count(),
      openCount: sql<number>`COUNT(*) FILTER (WHERE ${problems.status} = 'open')`,
    })
    .from(problems)
    .where(eq(problems.tenantId, tenantId))
    .groupBy(problems.reasonCategory);

  // Get recent open problems
  const recentProblems = await db.query.problems.findMany({
    where: and(
      eq(problems.tenantId, tenantId),
      eq(problems.status, 'open')
    ),
    with: {
      taskCompletion: {
        with: {
          task: {
            columns: { id: true, title: true },
            with: {
              area: { columns: { id: true, name: true } },
            },
          },
          user: {
            columns: { id: true, name: true },
          },
        },
      },
    },
    orderBy: [desc(problems.createdAt)],
    limit: 20,
  });

  return c.json({
    success: true,
    data: {
      stats: problemStats,
      recent: recentProblems,
    },
  });
});

// GET /api/dashboard/rankings - Area rankings by compliance
dashboardRoutes.get('/rankings', async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const period = c.req.query('period') || '7d';

  if (!['admin', 'manager'].includes(userRole)) {
    throw Errors.forbidden('No tiene permisos para ver rankings');
  }

  const endDate = new Date();
  const startDate = new Date();
  switch (period) {
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const areasStats = await getAreasStats(tenantId, startDate, endDate);

  // Sort by compliance rate
  const rankings = areasStats
    .filter((a) => a.metrics.total > 0)
    .sort((a, b) => b.metrics.complianceRate - a.metrics.complianceRate)
    .map((area, index) => ({
      rank: index + 1,
      areaId: area.areaId,
      areaName: area.areaName,
      areaCode: area.areaCode,
      complianceRate: area.metrics.complianceRate,
      onTimeRate: area.metrics.onTimeRate,
      totalTasks: area.metrics.total,
      trend: area.trend,
      trendPercentage: area.trendPercentage,
    }));

  return c.json({ success: true, data: rankings });
});
