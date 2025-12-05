'use client';

import { useCurrentUser } from '@/lib/api/users';
import { useTodaysTasks, priorityLabels, priorityColors } from '@/lib/api/tasks';
import { TaskCard, TaskCardSkeleton } from '@/components/tasks/task-card';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export default function HomePage() {
  const { data: userData } = useCurrentUser();
  const { data: tasks, isLoading, refetch, isRefetching } = useTodaysTasks();

  // Calculate stats from real tasks
  const stats = useMemo(() => {
    if (!tasks) {
      return {
        todayTasks: 0,
        completedToday: 0,
        pendingTasks: 0,
        problemsTasks: 0,
      };
    }

    return {
      todayTasks: tasks.length,
      completedToday: tasks.filter((t) => t.status === 'completed').length,
      pendingTasks: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
      problemsTasks: tasks.filter((t) =>
        t.checklistItems?.some((ci) => ci.status === 'problem')
      ).length,
    };
  }, [tasks]);

  // Group tasks by priority
  const tasksByPriority = useMemo(() => {
    if (!tasks) return { critical: [], high: [], medium: [], low: [] };

    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');

    return {
      critical: pending.filter((t) => t.priority === 'critical'),
      high: pending.filter((t) => t.priority === 'high'),
      medium: pending.filter((t) => t.priority === 'medium'),
      low: pending.filter((t) => t.priority === 'low'),
    };
  }, [tasks]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const statCards = [
    {
      label: 'Completadas',
      value: stats.completedToday,
      total: stats.todayTasks,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pendientes',
      value: stats.pendingTasks,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Con problemas',
      value: stats.problemsTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {userData?.name?.split(' ')[0] ?? 'Usuario'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border bg-card p-3 text-center"
            >
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-sm text-muted-foreground">/{stat.total}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progress for today */}
      <div className="mb-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Progreso del día</span>
            <span className="text-sm text-muted-foreground">
              {stats.completedToday} de {stats.todayTasks}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${stats.todayTasks ? (stats.completedToday / stats.todayTasks) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tareas de hoy
          </h2>
          <Link href="/tasks" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <CheckCircle className="mx-auto mb-2 h-10 w-10 text-green-500" />
            <p className="font-medium">¡No tienes tareas pendientes!</p>
            <p className="text-sm text-muted-foreground">Disfruta tu día</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Critical tasks first */}
            {tasksByPriority.critical.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-red-600">
                  CRÍTICAS ({tasksByPriority.critical.length})
                </h3>
                <div className="space-y-2">
                  {tasksByPriority.critical.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* High priority */}
            {tasksByPriority.high.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-orange-600">
                  ALTA PRIORIDAD ({tasksByPriority.high.length})
                </h3>
                <div className="space-y-2">
                  {tasksByPriority.high.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Medium priority */}
            {tasksByPriority.medium.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-yellow-600">
                  PRIORIDAD MEDIA ({tasksByPriority.medium.length})
                </h3>
                <div className="space-y-2">
                  {tasksByPriority.medium.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Low priority */}
            {tasksByPriority.low.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-green-600">
                  BAJA PRIORIDAD ({tasksByPriority.low.length})
                </h3>
                <div className="space-y-2">
                  {tasksByPriority.low.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Acciones rápidas
        </h2>
        <div className="space-y-2">
          <Link
            href="/tasks"
            className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Todas mis tareas</p>
                <p className="text-sm text-muted-foreground">
                  Historial y tareas futuras
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Link>

          {stats.problemsTasks > 0 && (
            <Link
              href="/problems"
              className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-700">Problemas reportados</p>
                  <p className="text-sm text-red-600">
                    {stats.problemsTasks} requieren atención
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-red-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
