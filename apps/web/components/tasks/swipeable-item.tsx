'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChecklistItem } from '@qualyit/database/schema';
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

interface SwipeableChecklistItemProps {
  item: ChecklistItem;
  disabled?: boolean;
  onComplete: (status: 'ok' | 'problem', problemReason?: string) => Promise<void>;
}

export function SwipeableChecklistItem({
  item,
  disabled = false,
  onComplete,
}: SwipeableChecklistItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [problemReason, setProblemReason] = useState('');

  const isCompleted = item.status !== 'pending';
  const isProblem = item.status === 'problem';

  const handleOk = async () => {
    if (disabled || isCompleted || isLoading) return;

    setIsLoading(true);
    try {
      await onComplete('ok');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProblem = () => {
    if (disabled || isCompleted) return;
    setShowProblemDialog(true);
  };

  const handleProblemSubmit = async () => {
    setIsLoading(true);
    try {
      await onComplete('problem', problemReason || undefined);
      setShowProblemDialog(false);
      setProblemReason('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-4 transition-colors',
          isCompleted && !isProblem && 'bg-green-50',
          isProblem && 'bg-red-50',
          !isCompleted && !disabled && 'hover:bg-muted/50'
        )}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : isCompleted ? (
            isProblem ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            )
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm',
              isCompleted && !isProblem && 'text-green-700 line-through',
              isProblem && 'text-red-700'
            )}
          >
            {item.description}
          </p>
          {isProblem && item.problemReason && (
            <p className="text-xs text-red-500 mt-1">
              Problema: {item.problemReason}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!isCompleted && !disabled && (
          <div className="flex gap-1">
            <button
              onClick={handleOk}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors"
              aria-label="Marcar como completado"
            >
              <CheckCircle2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleProblem}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
              aria-label="Reportar problema"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Problem dialog */}
      <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reportar problema</DialogTitle>
            <DialogDescription>
              Describe el problema encontrado con este item
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="¿Qué problema encontraste? (opcional)"
              value={problemReason}
              onChange={(e) => setProblemReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProblemDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleProblemSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Confirmar problema'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
