'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import type { Task, ChecklistItem } from '@qualyit/database/schema';

interface TaskWithChecklist extends Task {
  checklistItems?: ChecklistItem[];
}

interface TaskCompletionModalProps {
  open: boolean;
  onClose: () => void;
  task: TaskWithChecklist;
  onConfirm: (notes?: string) => Promise<void>;
}

export function TaskCompletionModal({
  open,
  onClose,
  task,
  onConfirm,
}: TaskCompletionModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedItems = task.checklistItems?.filter((i) => i.status !== 'pending').length ?? 0;
  const totalItems = task.checklistItems?.length ?? 0;
  const hasIncomplete = completedItems < totalItems;
  const hasProblems = task.checklistItems?.some((i) => i.status === 'problem');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Completar tarea
          </DialogTitle>
          <DialogDescription>
            {hasIncomplete ? (
              <span className="text-amber-600">
                Hay {totalItems - completedItems} item(s) sin completar en el checklist.
                ¿Deseas marcar la tarea como completada de todas formas?
              </span>
            ) : hasProblems ? (
              <span className="text-orange-600">
                Algunos items fueron marcados con problemas.
                La tarea se completará pero los problemas quedarán registrados.
              </span>
            ) : (
              'Confirma que has completado esta tarea.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Checklist summary */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso del checklist</span>
                <span className="font-medium">
                  {completedItems}/{totalItems}
                </span>
              </div>
              <div className="mt-2 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    hasProblems ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(completedItems / totalItems) * 100}%` }}
                />
              </div>
              {hasProblems && (
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {task.checklistItems.filter((i) => i.status === 'problem').length} item(s) con
                    problema
                  </span>
                </div>
              )}
            </div>
          )}

          <Textarea
            placeholder="Agregar notas u observaciones (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar completado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
