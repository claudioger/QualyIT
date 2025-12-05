'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAreas } from '@/lib/api/areas';
import { useUsers } from '@/lib/api/users';
import { ChecklistBuilder } from './checklist-builder';
import { RecurrenceSelector, type RecurrenceRule } from './recurrence-selector';
import { Loader2, Calendar, Clock, Flag } from 'lucide-react';

const taskFormSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  areaId: z.string().uuid('Seleccione un área'),
  type: z.enum(['scheduled', 'corrective', 'preventive']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  initialData?: Partial<TaskFormValues & {
    checklistItems?: Array<{ label: string }>;
    recurrenceRule?: RecurrenceRule;
  }>;
  onSubmit: (data: TaskFormValues & {
    checklistItems?: Array<{ label: string }>;
    recurrenceRule?: RecurrenceRule | null;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const taskTypes = [
  { value: 'scheduled', label: 'Programada', description: 'Tarea rutinaria programada' },
  { value: 'corrective', label: 'Correctiva', description: 'Corrección de un problema' },
  { value: 'preventive', label: 'Preventiva', description: 'Prevención de problemas' },
];

const priorities = [
  { value: 'low', label: 'Baja', color: 'text-blue-600' },
  { value: 'medium', label: 'Media', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'critical', label: 'Crítica', color: 'text-red-600' },
];

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskFormProps) {
  const { data: areas } = useAreas('flat');
  const { data: usersData } = useUsers({ pageSize: 100 });
  const users = usersData?.items || [];

  const [checklistItems, setChecklistItems] = useState<Array<{ label: string }>>(
    initialData?.checklistItems || []
  );
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    initialData?.recurrenceRule || null
  );
  const [showRecurrence, setShowRecurrence] = useState(!!initialData?.recurrenceRule);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      areaId: initialData?.areaId || '',
      type: initialData?.type || 'scheduled',
      priority: initialData?.priority || 'medium',
      assignedToId: initialData?.assignedToId || undefined,
      dueDate: initialData?.dueDate || '',
      scheduledTime: initialData?.scheduledTime || '',
    },
  });

  const handleSubmit = async (values: TaskFormValues) => {
    await onSubmit({
      ...values,
      checklistItems: checklistItems.length > 0 ? checklistItems : undefined,
      recurrenceRule: showRecurrence ? recurrenceRule : null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la tarea *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Limpieza de habitaciones Piso 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales sobre la tarea..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Area and Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="areaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(areas as Array<{ id: string; name: string; code?: string }>)?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} {area.code && `(${area.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de tarea</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Priority and Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Flag className="inline h-4 w-4 mr-1" />
                  Prioridad
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className={priority.color}>{priority.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedToId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asignar a</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {users.map((user: { id: string; name: string }) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Fecha de vencimiento
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Clock className="inline h-4 w-4 mr-1" />
                  Hora programada
                </FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Recurrence */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showRecurrence"
              checked={showRecurrence}
              onChange={(e) => setShowRecurrence(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="showRecurrence" className="text-sm font-medium">
              Tarea recurrente
            </label>
          </div>
          {showRecurrence && (
            <RecurrenceSelector
              value={recurrenceRule}
              onChange={setRecurrenceRule}
            />
          )}
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <FormLabel>Lista de verificación</FormLabel>
          <FormDescription>
            Agrega items que deben completarse como parte de esta tarea
          </FormDescription>
          <ChecklistBuilder
            items={checklistItems}
            onChange={setChecklistItems}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialData ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
