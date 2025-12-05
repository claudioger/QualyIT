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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Clock, Package, Wrench, HelpCircle, Loader2 } from 'lucide-react';

type ProblemReason = 'no_time' | 'no_supplies' | 'equipment_broken' | 'other';

interface ProblemReportFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    problemReason: ProblemReason;
    problemDescription?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const problemReasons: { value: ProblemReason; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    value: 'no_time',
    label: 'Sin tiempo',
    description: 'No tuve tiempo suficiente para completar',
    icon: Clock,
  },
  {
    value: 'no_supplies',
    label: 'Sin suministros',
    description: 'Faltan materiales o productos necesarios',
    icon: Package,
  },
  {
    value: 'equipment_broken',
    label: 'Equipo averiado',
    description: 'El equipo necesario no funciona',
    icon: Wrench,
  },
  {
    value: 'other',
    label: 'Otro motivo',
    description: 'Especificar en la descripción',
    icon: HelpCircle,
  },
];

export function ProblemReportForm({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ProblemReportFormProps) {
  const [reason, setReason] = useState<ProblemReason | ''>('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;

    await onSubmit({
      problemReason: reason,
      problemDescription: description || undefined,
    });
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Reportar problema
          </DialogTitle>
          <DialogDescription>
            Selecciona el motivo por el cual no puedes completar esta tarea
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Problem reason selection */}
          <div>
            <Label className="text-sm font-medium">Motivo del problema</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as ProblemReason)}
              className="mt-2 space-y-2"
            >
              {problemReasons.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      reason === option.value
                        ? 'border-red-300 bg-red-50'
                        : 'border-muted hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        reason === option.value ? 'bg-red-100' : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          reason === option.value ? 'text-red-600' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          reason === option.value ? 'text-red-700' : ''
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        reason === option.value
                          ? 'border-red-500 bg-red-500'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {reason === option.value && (
                        <div className="h-full w-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción adicional {reason !== 'other' && '(opcional)'}
            </Label>
            <Textarea
              id="description"
              placeholder="Describe el problema con más detalle..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting || (reason === 'other' && !description)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reportar problema
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
