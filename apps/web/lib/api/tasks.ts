import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Task, ChecklistItem } from '@qualyit/database/schema';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Types
interface TaskWithRelations extends Task {
  area?: { id: string; name: string; code: string };
  checklistItems?: ChecklistItem[];
}

interface TaskListResponse {
  items: TaskWithRelations[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface TaskFilters {
  status?: string;
  areaId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | undefined;
}

interface CompleteTaskInput {
  taskId: string;
  status: 'ok' | 'problem';
  notes?: string;
  problemReason?: 'no_time' | 'no_supplies' | 'equipment_broken' | 'other';
  problemDescription?: string;
}

interface CompleteChecklistItemInput {
  taskId: string;
  itemId: string;
  status: 'ok' | 'problem';
  problemReason?: string;
}

interface CreateTaskInput {
  areaId: string;
  title: string;
  description?: string;
  type?: 'scheduled' | 'corrective' | 'preventive';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  assignedToId?: string;
  dueDate?: string;
  scheduledTime?: string;
  checklistItems?: { description: string }[];
}

// Hooks

/**
 * Fetch tasks with optional filters
 */
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<TaskListResponse>('/tasks', {
        status: filters.status,
        areaId: filters.areaId,
        type: filters.type,
        page: filters.page,
        pageSize: filters.pageSize,
      });
      return response.data;
    },
  });
}

/**
 * Fetch today's tasks (optimized for mobile dashboard)
 */
export function useTodaysTasks() {
  return useQuery({
    queryKey: taskKeys.today(),
    queryFn: async () => {
      const response = await api.get<TaskWithRelations[]>('/tasks/today');
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Fetch single task details
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<TaskWithRelations>(`/tasks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const response = await api.post<Task>('/tasks', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateTaskInput>) => {
      const response = await api.patch<Task>(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, ...data }: CompleteTaskInput) => {
      const response = await api.post<{ id: string }>(`/tasks/${taskId}/complete`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.today() });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Complete a checklist item
 */
export function useCompleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, itemId, ...data }: CompleteChecklistItemInput) => {
      const response = await api.post<ChecklistItem>(
        `/tasks/${taskId}/checklist/${itemId}/complete`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ id: string }>(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Priority labels and colors for UI
export const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export const priorityColors: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-green-500 text-white',
};

export const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-200 text-blue-700',
  completed: 'bg-green-200 text-green-700',
  cancelled: 'bg-red-200 text-red-700',
};

export const typeLabels: Record<string, string> = {
  scheduled: 'Programada',
  corrective: 'Correctiva',
  preventive: 'Preventiva',
};
