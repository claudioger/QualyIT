'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskForm } from '@/components/tasks/task-form';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewTaskPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      areaId: string;
      type: string;
      priority: string;
      assignedToId?: string;
      dueDate?: string;
      scheduledTime?: string;
      checklistItems?: Array<{ label: string }>;
    }) => {
      const response = await api.post('tasks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Tarea creada',
        description: 'La tarea se ha creado exitosamente',
      });
      router.push('/tasks');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la tarea',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: {
    title: string;
    description?: string;
    areaId: string;
    type: string;
    priority: string;
    assignedToId?: string;
    dueDate?: string;
    scheduledTime?: string;
    checklistItems?: Array<{ label: string }>;
  }) => {
    await createTaskMutation.mutateAsync(data);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            Nueva Tarea
          </h1>
          <p className="text-muted-foreground">Crear una nueva tarea para el equipo</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la tarea</CardTitle>
          <CardDescription>
            Complete la información para crear una nueva tarea. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={createTaskMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
