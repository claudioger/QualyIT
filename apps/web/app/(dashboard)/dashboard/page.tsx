'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

interface DashboardStats {
  compliance: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
  };
  tasksByArea: {
    areaId: string;
    areaName: string;
    total: number;
    completed: number;
  }[];
  weeklyTasks: {
    date: string;
    completed: number;
    total: number;
  }[];
  openProblems: number;
  pendingVerifications: number;
}

export default function DashboardPage() {
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', weekOffset],
    queryFn: async () => {
      // This would be a real endpoint
      const mockStats: DashboardStats = {
        compliance: {
          current: 87,
          previous: 82,
          trend: 'up',
        },
        tasksByArea: [
          { areaId: '1', areaName: 'Recepción', total: 45, completed: 42 },
          { areaId: '2', areaName: 'Housekeeping', total: 120, completed: 98 },
          { areaId: '3', areaName: 'Restaurante', total: 60, completed: 55 },
          { areaId: '4', areaName: 'Mantenimiento', total: 30, completed: 25 },
        ],
        weeklyTasks: [
          { date: '2024-01-15', completed: 42, total: 48 },
          { date: '2024-01-16', completed: 45, total: 48 },
          { date: '2024-01-17', completed: 40, total: 48 },
          { date: '2024-01-18', completed: 48, total: 48 },
          { date: '2024-01-19', completed: 35, total: 48 },
          { date: '2024-01-20', completed: 20, total: 24 },
          { date: '2024-01-21', completed: 18, total: 24 },
        ],
        openProblems: 3,
        pendingVerifications: 8,
      };
      return mockStats;
    },
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getWeekLabel = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (weekOffset === 0) {
      return 'Esta semana';
    }
    if (weekOffset === -1) {
      return 'Semana pasada';
    }

    return `${startOfWeek.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    })} - ${endOfWeek.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>

      {/* Compliance Card */}
      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cumplimiento general</span>
          {stats?.compliance && getTrendIcon(stats.compliance.trend)}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold">{stats?.compliance.current ?? 0}%</span>
          {stats?.compliance && (
            <span
              className={`mb-1 text-sm ${
                stats.compliance.trend === 'up'
                  ? 'text-green-500'
                  : stats.compliance.trend === 'down'
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              {stats.compliance.trend === 'up' && '+'}
              {stats.compliance.current - stats.compliance.previous}% vs semana anterior
            </span>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${stats?.compliance.current ?? 0}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold">{stats?.openProblems ?? 0}</p>
          <p className="text-sm text-muted-foreground">Problemas abiertos</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold">{stats?.pendingVerifications ?? 0}</p>
          <p className="text-sm text-muted-foreground">Por verificar</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tareas completadas</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded p-1 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-28 text-center text-xs text-muted-foreground">
              {getWeekLabel()}
            </span>
            <button
              onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
              disabled={weekOffset >= 0}
              className="rounded p-1 hover:bg-muted disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="flex h-32 items-end justify-between gap-1">
          {stats?.weeklyTasks.map((day, index) => {
            const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
            const dayName = new Date(day.date).toLocaleDateString('es-AR', {
              weekday: 'short',
            });

            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full flex-1">
                  <div className="absolute bottom-0 w-full rounded-t bg-muted" style={{ height: '100%' }} />
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-primary transition-all"
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Area */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
          Cumplimiento por área
        </h3>
        <div className="space-y-3">
          {stats?.tasksByArea.map((area) => {
            const percentage = area.total > 0 ? Math.round((area.completed / area.total) * 100) : 0;
            return (
              <div key={area.areaId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{area.areaName}</span>
                  <span className="text-muted-foreground">
                    {area.completed}/{area.total} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage >= 90
                        ? 'bg-green-500'
                        : percentage >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
