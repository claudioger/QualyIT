'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { api } from '@/lib/api/client';
import {
  Settings,
  Building2,
  User,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Save,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  notificationPreferences: {
    newTasks: boolean;
    taskReminders: boolean;
    problemReports: boolean;
  };
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export default function SettingsPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const response = await api.get<Tenant>('/tenants/me');
      return response.data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get<UserProfile>('/users/me');
      return response.data;
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: Partial<Tenant>) => {
      const response = await api.patch<Tenant>('/tenants/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await api.patch<UserProfile>(`/users/${profile?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const sections = [
    {
      id: 'organization',
      icon: Building2,
      label: 'Organización',
      description: 'Nombre, logo y configuración',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Mi perfil',
      description: 'Datos personales y contraseña',
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notificaciones',
      description: 'Preferencias de alertas',
    },
    {
      id: 'appearance',
      icon: Palette,
      label: 'Apariencia',
      description: 'Tema y preferencias visuales',
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'organization':
        return (
          <OrganizationSection
            tenant={tenant}
            onSave={(data) => updateTenantMutation.mutate(data)}
            isSaving={updateTenantMutation.isPending}
            onBack={() => setActiveSection(null)}
          />
        );
      case 'profile':
        return (
          <ProfileSection
            profile={profile}
            onBack={() => setActiveSection(null)}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            profile={profile}
            onSave={(data) => updateProfileMutation.mutate(data)}
            isSaving={updateProfileMutation.isPending}
            onBack={() => setActiveSection(null)}
          />
        );
      case 'appearance':
        return (
          <AppearanceSection
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onBack={() => setActiveSection(null)}
          />
        );
      default:
        return null;
    }
  };

  if (activeSection) {
    return renderSection();
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Configuración</h1>
      </div>

      {/* User Card */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
            {profile?.name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-medium">{profile?.name ?? 'Usuario'}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{section.label}</p>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Sign Out */}
      <div className="mt-6">
        <SignOutButton>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 transition-colors hover:bg-red-100">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </SignOutButton>
      </div>

      {/* App Version */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        QualyIT v1.0.0
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
      <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-5 w-5 rotate-180" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function OrganizationSection({
  tenant,
  onSave,
  isSaving,
  onBack,
}: {
  tenant?: Tenant;
  onSave: (data: Partial<Tenant>) => void;
  isSaving: boolean;
  onBack: () => void;
}) {
  const [name, setName] = useState(tenant?.name ?? '');

  return (
    <div className="flex flex-col">
      <SectionHeader title="Organización" onBack={onBack} />
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Subdominio</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tenant?.subdomain ?? ''}
                disabled
                className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
              />
              <span className="text-sm text-muted-foreground">.qualyit.app</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              El subdominio no puede modificarse
            </p>
          </div>

          <button
            onClick={() => onSave({ name })}
            disabled={isSaving || name === tenant?.name}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({
  profile,
  onBack,
}: {
  profile?: UserProfile;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col">
      <SectionHeader title="Mi perfil" onBack={onBack} />
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre</label>
            <input
              type="text"
              value={profile?.name ?? ''}
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              El nombre se gestiona desde Clerk
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={profile?.email ?? ''}
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Rol</label>
            <input
              type="text"
              value={
                profile?.role === 'admin'
                  ? 'Administrador'
                  : profile?.role === 'manager'
                  ? 'Gerente'
                  : profile?.role === 'supervisor'
                  ? 'Supervisor'
                  : 'Empleado'
              }
              disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({
  profile,
  onSave,
  isSaving,
  onBack,
}: {
  profile?: UserProfile;
  onSave: (data: Partial<UserProfile>) => void;
  isSaving: boolean;
  onBack: () => void;
}) {
  const [preferences, setPreferences] = useState(
    profile?.notificationPreferences ?? {
      newTasks: true,
      taskReminders: true,
      problemReports: true,
    }
  );
  const [quietStart, setQuietStart] = useState(profile?.quietHoursStart ?? '');
  const [quietEnd, setQuietEnd] = useState(profile?.quietHoursEnd ?? '');

  const handleSave = () => {
    onSave({
      notificationPreferences: preferences,
      quietHoursStart: quietStart || null,
      quietHoursEnd: quietEnd || null,
    });
  };

  return (
    <div className="flex flex-col">
      <SectionHeader title="Notificaciones" onBack={onBack} />
      <div className="p-4">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-medium">Tipos de notificaciones</h3>
            <div className="space-y-3">
              {[
                { key: 'newTasks', label: 'Nuevas tareas asignadas' },
                { key: 'taskReminders', label: 'Recordatorios de tareas' },
                { key: 'problemReports', label: 'Reportes de problemas' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[item.key as keyof typeof preferences]}
                    onChange={(e) =>
                      setPreferences({ ...preferences, [item.key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Horas de silencio</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              No recibirá notificaciones durante este período
            </p>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({
  isDark,
  onToggleDark,
  onBack,
}: {
  isDark: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col">
      <SectionHeader title="Apariencia" onBack={onBack} />
      <div className="p-4">
        <div className="space-y-4">
          <button
            onClick={onToggleDark}
            className="flex w-full items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-left">
                <p className="font-medium">Modo oscuro</p>
                <p className="text-sm text-muted-foreground">
                  {isDark ? 'Activado' : 'Desactivado'}
                </p>
              </div>
            </div>
            <div
              className={`h-6 w-11 rounded-full p-1 transition-colors ${
                isDark ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Más opciones de personalización próximamente
          </p>
        </div>
      </div>
    </div>
  );
}
