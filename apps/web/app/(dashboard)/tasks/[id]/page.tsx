'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTask, useCompleteTask, priorityLabels, priorityColors } from '@/lib/api/tasks';
import { useOfflineStore } from '@/stores/offline';
import {
  ChevronLeft,
  Clock,
  Camera,
  CheckCircle,
  Circle,
  Play,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  description: string;
  sortOrder: number;
  status: string;
}

interface ChecklistResponse {
  checked: boolean;
  value?: string;
}

const typeLabels: Record<string, string> = {
  scheduled: 'Programada',
  corrective: 'Correctiva',
  preventive: 'Preventiva',
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isOnline, addPendingCompletion } = useOfflineStore();

  const [checklistResponses, setChecklistResponses] = useState<Record<string, ChecklistResponse>>({});
  const [notes, setNotes] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const { data: task, isLoading } = useTask(id);
  const completeTask = useCompleteTask();

  const handleStartTask = () => {
    setIsStarted(true);
  };

  const handleChecklistChange = (itemId: string, checked: boolean, value?: string) => {
    setChecklistResponses((prev) => ({
      ...prev,
      [itemId]: { checked, value },
    }));
  };

  const handleComplete = async () => {
    const completionData = {
      status: 'ok' as const,
      notes: notes || undefined,
    };

    if (!isOnline) {
      addPendingCompletion({
        id: `offline_${Date.now()}`,
        taskId: id,
        checklistResponses,
        notes: notes || undefined,
        completedAt: new Date().toISOString(),
        synced: false,
      });
      router.push('/tasks');
      return;
    }

    completeTask.mutate(
      { taskId: id, ...completionData },
      {
        onSuccess: () => {
          router.push('/tasks');
        },
      }
    );
  };

  const checklistItems = (task?.checklistItems || []) as ChecklistItem[];
  const allChecked = checklistItems.length === 0 ||
    checklistItems.every((item: ChecklistItem) => checklistResponses[item.id]?.checked);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-4">
        <p>Tarea no encontrada</p>
        <Link href="/tasks" className="text-primary">
          Volver a tareas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="flex items-center gap-3">
          <Link href="/tasks" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{task.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {task.area?.code}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Task Info */}
        <div className="mb-4 rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{task.scheduledTime ?? 'Sin hora'}</span>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {typeLabels[task.type]}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
        </div>

        {/* Not started state */}
        {!isStarted && task.status !== 'completed' && (
          <div className="mb-4">
            <button
              onClick={handleStartTask}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Play className="h-5 w-5" />
              Iniciar tarea
            </button>
          </div>
        )}

        {/* Task in progress */}
        {(isStarted || task.status === 'in_progress') && task.status !== 'completed' && (
          <>
            {/* Checklist */}
            {checklistItems.length > 0 && (
              <div className="mb-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Checklist
                </h2>
                <div className="space-y-2">
                  {checklistItems
                    .sort((a: ChecklistItem, b: ChecklistItem) => a.sortOrder - b.sortOrder)
                    .map((item: ChecklistItem) => {
                      const isChecked = checklistResponses[item.id]?.checked ?? false;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleChecklistChange(item.id, !isChecked)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                            isChecked
                              ? 'border-green-200 bg-green-50'
                              : 'bg-card hover:bg-muted/50'
                          )}
                        >
                          {isChecked ? (
                            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          )}
                          <span className={cn('flex-1', isChecked && 'text-green-700')}>
                            {item.description}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar observaciones..."
                className="w-full rounded-lg border bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
            </div>

            {/* Photos */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Fotos (opcional)
              </label>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <Camera className="h-5 w-5" />
                <span>Agregar foto</span>
              </button>
            </div>

            {/* Complete button */}
            <div className="sticky bottom-20 pb-4">
              <button
                onClick={handleComplete}
                disabled={!allChecked || completeTask.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {completeTask.isPending ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>{isOnline ? 'Completar tarea' : 'Guardar offline'}</span>
                  </>
                )}
              </button>
              {!allChecked && (
                <p className="mt-2 text-center text-xs text-red-500">
                  Complete todos los items del checklist
                </p>
              )}
            </div>
          </>
        )}

        {/* Completed state */}
        {task.status === 'completed' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <h3 className="font-semibold text-green-700">Tarea completada</h3>
            <p className="mt-1 text-sm text-green-600">
              Esta tarea ya ha sido completada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
