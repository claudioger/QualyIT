import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Types
export interface Area {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  code: string | null;
  responsibleId: string | null;
  backupResponsibleId: string | null;
  settings: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  responsible?: { id: string; name: string; avatarUrl: string | null };
  backupResponsible?: { id: string; name: string; avatarUrl: string | null };
  parent?: { id: string; name: string };
  children?: { id: string; name: string }[];
}

export interface AreaTreeNode extends Area {
  children: AreaTreeNode[];
}

export interface CreateAreaInput {
  name: string;
  code?: string;
  parentId?: string;
  responsibleId?: string;
  backupResponsibleId?: string;
  settings?: Record<string, unknown>;
  sortOrder?: number;
}

export interface UpdateAreaInput {
  name?: string;
  code?: string;
  parentId?: string | null;
  responsibleId?: string | null;
  backupResponsibleId?: string | null;
  settings?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
}

// Query keys
export const areaKeys = {
  all: ['areas'] as const,
  lists: () => [...areaKeys.all, 'list'] as const,
  list: (format: 'flat' | 'tree') => [...areaKeys.lists(), format] as const,
  details: () => [...areaKeys.all, 'detail'] as const,
  detail: (id: string) => [...areaKeys.details(), id] as const,
};

// Hooks
export function useAreas(format: 'flat' | 'tree' = 'flat') {
  return useQuery({
    queryKey: areaKeys.list(format),
    queryFn: async () => {
      const response = await api.get<Area[] | AreaTreeNode[]>('/areas', { format });
      return response.data;
    },
  });
}

export function useArea(id: string) {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<Area>(`/areas/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAreaInput) => {
      const response = await api.post<Area>('/areas', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAreaInput }) => {
      const response = await api.patch<Area>(`/areas/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.id) });
    },
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ id: string }>(`/areas/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

export function useAssignUsersToArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ areaId, userIds }: { areaId: string; userIds: string[] }) => {
      const response = await api.post<{ areaId: string; userIds: string[] }>(
        `/areas/${areaId}/users`,
        { userIds }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.areaId) });
    },
  });
}

export function useRemoveUserFromArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ areaId, userId }: { areaId: string; userId: string }) => {
      const response = await api.delete<{ areaId: string; userId: string }>(
        `/areas/${areaId}/users/${userId}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.areaId) });
    },
  });
}
