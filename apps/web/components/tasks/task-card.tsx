'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, CheckSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { priorityColors, priorityLabels, statusColors, statusLabels } from '@/lib/api/tasks';
import type { Task, ChecklistItem } from '@qualyit/database/schema';
import { cn } from '@/lib/utils';

interface TaskWithRelations extends Task {
  area?: { id: string; name: string; code: string };
  checklistItems?: ChecklistItem[];
}

interface TaskCardProps {
  task: TaskWithRelations;
  compact?: boolean;
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const completedItems = task.checklistItems?.filter((item) => item.status !== 'pending').length ?? 0;
  const totalItems = task.checklistItems?.length ?? 0;
  const hasProblems = task.checklistItems?.some((item) => item.status === 'problem');

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card
        className={cn(
          'transition-all hover:shadow-md active:scale-[0.98]',
          task.status === 'completed' && 'opacity-60',
          hasProblems && 'border-l-4 border-l-red-500'
        )}
      >
        <CardContent className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Priority and Area */}
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
                  {priorityLabels[task.priority] || task.priority}
                </Badge>
                {task.area && (
                  <Badge variant="outline" className="text-xs">
                    {task.area.code}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className={cn('font-medium line-clamp-2', compact ? 'text-sm' : 'text-base')}>
                {task.title}
              </h3>

              {/* Description (only if not compact) */}
              {!compact && task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {/* Scheduled time */}
                {task.scheduledTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.scheduledTime}</span>
                  </div>
                )}

                {/* Area name */}
                {task.area && !compact && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{task.area.name}</span>
                  </div>
                )}

                {/* Checklist progress */}
                {totalItems > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    <span>
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                )}

                {/* Problem indicator */}
                {hasProblems && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Problema</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status badge */}
            <Badge
              variant="secondary"
              className={cn('text-xs shrink-0', statusColors[task.status])}
            >
              {statusLabels[task.status] || task.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Skeleton loader for task cards
 */
export function TaskCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
            {!compact && <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />}
            <div className="flex items-center gap-3 mt-2">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
