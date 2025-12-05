import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Types
export interface User {
  id: string;
  tenantId: string;
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'employee';
  notificationPreferences: Record<string, unknown>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithAreas extends User {
  areas: { id: string; name: string; code: string | null }[];
}

export interface UserListResponse {
  items: User[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role?: 'admin' | 'manager' | 'supervisor' | 'employee';
  temporaryPassword: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
  role?: 'admin' | 'manager' | 'supervisor' | 'employee';
  notificationPreferences?: Record<string, unknown>;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  isActive?: boolean;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  areaId?: string;
}

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

// Hooks
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<UserListResponse>('/users', {
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search,
        role: filters.role,
        areaId: filters.areaId,
      });
      return response.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<UserWithAreas>(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await api.get<User>('/users/me');
      return response.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await api.post<User & { temporaryPassword: string }>('/users', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await api.patch<User>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ id: string }>(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const response = await api.post<{ message: string }>('/users/change-password', input);
      return response.data;
    },
  });
}

// Helper function to generate temporary password
export function generateTemporaryPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';
  let password = '';

  for (let i = 0; i < 3; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 4; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  for (let i = 0; i < 3; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  return password;
}

// Role labels in Spanish
export const roleLabels: Record<User['role'], string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  supervisor: 'Supervisor',
  employee: 'Empleado',
};

export const roleColors: Record<User['role'], string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-purple-100 text-purple-800',
  supervisor: 'bg-blue-100 text-blue-800',
  employee: 'bg-green-100 text-green-800',
};
