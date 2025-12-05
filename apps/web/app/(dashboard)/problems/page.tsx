'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  AlertTriangle,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  Circle,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  createdAt: string;
  area: {
    id: string;
    name: string;
    code: string;
  };
  reportedByUser: {
    id: string;
    name: string;
  };
}

const severityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const severityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

const statusLabels: Record<string, string> = {
  open: 'Abierto',
  assigned: 'Asignado',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const statusIcons: Record<string, typeof Circle> = {
  open: AlertTriangle,
  assigned: Clock,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

const statusColors: Record<string, string> = {
  open: 'text-red-500',
  assigned: 'text-amber-500',
  in_progress: 'text-blue-500',
  resolved: 'text-green-500',
  closed: 'text-gray-500',
};

type FilterType = 'open' | 'resolved' | 'all';

export default function ProblemsPage() {
  const [filter, setFilter] = useState<FilterType>('open');

  const { data: problemsData, isLoading } = useQuery({
    queryKey: ['problems', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'open') {
        params.set('status', 'open');
      } else if (filter === 'resolved') {
        params.set('status', 'resolved');
      }
      const response = await api.get<{ items: Problem[] }>(`/problems?${params}`);
      return response.data;
    },
  });

  const problems = problemsData?.items ?? [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `hace ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `hace ${diffHours}h`;
    }
    if (diffDays < 7) {
      return `hace ${diffDays}d`;
    }
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h1 className="text-lg font-semibold">Problemas</h1>
          </div>
          <Link
            href="/problems/new"
            className="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
          >
            <Plus className="h-4 w-4" />
            Reportar
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'open', label: 'Abiertos' },
            { key: 'resolved', label: 'Resueltos' },
            { key: 'all', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-red-500 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problems List */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium">
              {filter === 'open'
                ? 'No hay problemas abiertos'
                : filter === 'resolved'
                ? 'No hay problemas resueltos'
                : 'No hay problemas'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'open' && '¡Excelente! Todo está en orden'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((problem: Problem) => {
              const StatusIcon = statusIcons[problem.status] ?? Circle;

              return (
                <Link
                  key={problem.id}
                  href={`/problems/${problem.id}`}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${statusColors[problem.status]}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-medium truncate">{problem.title}</h3>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            severityColors[problem.severity]
                          }`}
                        >
                          {severityLabels[problem.severity]}
                        </span>
                      </div>

                      {problem.description && (
                        <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                          {problem.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {problem.area.code}
                        </span>
                        <span>•</span>
                        <span>{problem.reportedByUser.name}</span>
                        <span>•</span>
                        <span>{formatDate(problem.createdAt)}</span>
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
