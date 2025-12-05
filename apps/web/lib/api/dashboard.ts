import { useQuery } from '@tanstack/react-query';
import { api } from './client';

interface AreaMetrics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  withProblems: number;
  complianceRate: number;
  onTimeRate: number;
}

interface AreaStats {
  areaId: string;
  areaName: string;
  areaCode: string | null;
  metrics: AreaMetrics;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface Alert {
  id: string;
  type: 'overdue' | 'problem' | 'low_compliance' | 'urgent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  areaId: string;
  areaName: string;
  taskId?: string;
  createdAt: string;
}

interface DashboardOverview {
  overview: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    withProblems: number;
    complianceRate: number;
  };
  areas: AreaStats[];
  criticalAlerts: Alert[];
}

interface TrendPoint {
  date: string;
  compliance: number;
  tasks: number;
}

interface AreaRanking {
  rank: number;
  areaId: string;
  areaName: string;
  areaCode: string | null;
  complianceRate: number;
  onTimeRate: number;
  totalTasks: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

/**
 * Get manager dashboard overview
 */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('dashboard');
      return response.data as DashboardOverview;
    },
  });
}

/**
 * Get compliance trends
 */
export function useDashboardTrends(options?: { days?: number; areaId?: string }) {
  const { days = 30, areaId } = options || {};

  return useQuery({
    queryKey: ['dashboard', 'trends', { days, areaId }],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() });
      if (areaId) params.set('areaId', areaId);

      const response = await api.get(`dashboard/trends?${params}`);
      return response.data as TrendPoint[];
    },
  });
}

/**
 * Get all alerts
 */
export function useDashboardAlerts(options?: { severity?: string; limit?: number }) {
  const { severity, limit = 50 } = options || {};

  return useQuery({
    queryKey: ['dashboard', 'alerts', { severity, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (severity) params.set('severity', severity);

      const response = await api.get(`dashboard/alerts?${params}`);
      return response.data as Alert[];
    },
  });
}

/**
 * Get area rankings by compliance
 */
export function useDashboardRankings(period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: ['dashboard', 'rankings', period],
    queryFn: async () => {
      const response = await api.get(`dashboard/rankings?period=${period}`);
      return response.data as AreaRanking[];
    },
  });
}

/**
 * Get area-specific stats
 */
export function useAreaStats(areaId: string, period: '7d' | '30d' | '90d' = '7d') {
  return useQuery({
    queryKey: ['area-stats', areaId, period],
    queryFn: async () => {
      const response = await api.get(`areas/${areaId}/stats?period=${period}`);
      return response.data as {
        area: { id: string; name: string; code: string | null };
        period: string;
        metrics: AreaMetrics;
        alerts: Alert[];
        trend: TrendPoint[];
      };
    },
    enabled: !!areaId,
  });
}
