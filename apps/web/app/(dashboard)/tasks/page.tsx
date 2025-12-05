'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  CheckSquare,
  Filter,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  area: {
    id: string;
    name: string;
    code: string;
  };
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  verified: 'Verificada',
};

const statusIcons: Record<string, typeof Circle> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle,
  verified: CheckCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-amber-500',
  completed: 'text-green-500',
  verified: 'text-green-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

type FilterType = 'all' | 'pending' | 'completed';

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>('pending');
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      const response = await api.get<{ items: Task[] }>(`/tasks?${params}`);
      return response.data;
    },
  });

  const tasks = tasksData?.items ?? [];

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    }
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Mis Tareas</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-md p-2 ${
              showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'pending', label: 'Pendientes' },
            { key: 'completed', label: 'Completadas' },
            { key: 'all', label: 'Todas' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium">
              {filter === 'pending'
                ? 'No hay tareas pendientes'
                : filter === 'completed'
                ? 'No hay tareas completadas'
                : 'No hay tareas'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'pending' && '¡Excelente trabajo!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task: Task) => {
              const StatusIcon = statusIcons[task.status] ?? Circle;
              const overdue = isOverdue(task.dueDate) && task.status !== 'completed';

              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${statusColors[task.status]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {task.area.code}
                        </span>
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${
                              overdue ? 'text-red-500' : ''
                            }`}
                          >
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
