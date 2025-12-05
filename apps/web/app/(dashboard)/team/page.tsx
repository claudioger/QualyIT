'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'employee';
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface CreateUserData {
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'supervisor' | 'employee';
  temporaryPassword: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  supervisor: 'Supervisor',
  employee: 'Empleado',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  supervisor: 'bg-green-100 text-green-700',
  employee: 'bg-gray-100 text-gray-700',
};

function generateTempPassword(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';
  let password = '';
  for (let i = 0; i < 3; i++) password += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) password += numbers[Math.floor(Math.random() * numbers.length)];
  for (let i = 0; i < 3; i++) password += letters[Math.floor(Math.random() * letters.length)];
  return password;
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Form state
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    name: '',
    role: 'employee',
    temporaryPassword: generateTempPassword(),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await api.get<{ items: User[] }>(`/users?${params}`);
      return response.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post<User & { temporaryPassword: string }>(
        '/users',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      if (data) {
        setShowPasswordModal({
          name: data.name,
          email: data.email,
          password: newUser.temporaryPassword,
        });
      }
      setNewUser({
        email: '',
        name: '',
        role: 'employee',
        temporaryPassword: generateTempPassword(),
      });
    },
  });

  const handleCopyPassword = async () => {
    if (showPasswordModal) {
      await navigator.clipboard.writeText(showPasswordModal.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const users = usersData?.items ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Equipo</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium">Sin miembros del equipo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Agregue usuarios para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user: User) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {user.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      roleColors[user.role]
                    }`}
                  >
                    {roleLabels[user.role]}
                  </span>
                  {user.mustChangePassword && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo usuario</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nombre completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="juan@hotel.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as CreateUserData['role'],
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="employee">Empleado</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Contraseña temporal
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUser.temporaryPassword}
                    readOnly
                    className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm"
                  />
                  <button
                    onClick={() =>
                      setNewUser({ ...newUser, temporaryPassword: generateTempPassword() })
                    }
                    className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    Generar
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  El usuario deberá cambiar esta contraseña en su primer inicio de sesión
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={
                    createUserMutation.isPending ||
                    !newUser.name ||
                    !newUser.email ||
                    !newUser.temporaryPassword
                  }
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Usuario creado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Comparta estas credenciales con {showPasswordModal.name}
              </p>
            </div>

            <div className="mb-4 space-y-3 rounded-lg bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{showPasswordModal.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contraseña temporal</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg font-bold tracking-wider">
                    {showPasswordModal.password}
                  </p>
                  <button
                    onClick={handleCopyPassword}
                    className="rounded p-1 hover:bg-background"
                  >
                    {copiedPassword ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Importante</p>
              <p className="mt-1">
                Esta contraseña solo se muestra una vez. Asegúrese de compartirla de forma
                segura con el usuario.
              </p>
            </div>

            <button
              onClick={() => setShowPasswordModal(null)}
              className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
