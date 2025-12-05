'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  AlertCircle,
  Smartphone,
  Mail,
  Moon,
  Trash2,
  Loader2,
  Monitor,
  TabletSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useNotificationPreferences,
  useUpdatePreferences,
  useUpdateQuietHours,
  useDevices,
  useUnregisterDevice,
} from '@/lib/api/notifications';

const notificationTypes = [
  {
    key: 'taskAssigned',
    label: 'Tarea asignada',
    description: 'Cuando te asignan una nueva tarea',
    icon: Bell,
  },
  {
    key: 'taskReminder',
    label: 'Recordatorio de tarea',
    description: 'Antes de que venza una tarea',
    icon: Clock,
  },
  {
    key: 'taskOverdue',
    label: 'Tarea vencida',
    description: 'Cuando una tarea pasa su fecha límite',
    icon: AlertTriangle,
  },
  {
    key: 'problemReported',
    label: 'Problema reportado',
    description: 'Cuando alguien reporta un problema',
    icon: AlertCircle,
  },
] as const;

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  web: Monitor,
  android: TabletSmartphone,
  ios: TabletSmartphone,
};

export function NotificationPreferences() {
  const { data: prefsData, isLoading: prefsLoading } = useNotificationPreferences();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const updatePreferences = useUpdatePreferences();
  const updateQuietHours = useUpdateQuietHours();
  const unregisterDevice = useUnregisterDevice();

  const [preferences, setPreferences] = useState(prefsData?.preferences || {});
  const [quietStart, setQuietStart] = useState(prefsData?.quietHours?.start || '');
  const [quietEnd, setQuietEnd] = useState(prefsData?.quietHours?.end || '');

  useEffect(() => {
    if (prefsData) {
      setPreferences(prefsData.preferences);
      setQuietStart(prefsData.quietHours?.start || '');
      setQuietEnd(prefsData.quietHours?.end || '');
    }
  }, [prefsData]);

  const handleToggleType = (key: string, enabled: boolean) => {
    const newPrefs = { ...preferences, [key]: enabled };
    setPreferences(newPrefs);
    updatePreferences.mutate(newPrefs);
  };

  const handleToggleChannel = (channel: 'push' | 'email', enabled: boolean) => {
    const newPrefs = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [channel]: enabled,
      },
    };
    setPreferences(newPrefs);
    updatePreferences.mutate(newPrefs);
  };

  const handleSaveQuietHours = () => {
    updateQuietHours.mutate({
      start: quietStart || null,
      end: quietEnd || null,
    });
  };

  const handleRemoveDevice = (deviceId: string) => {
    unregisterDevice.mutate(deviceId);
  };

  if (prefsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de notificación</CardTitle>
          <CardDescription>
            Elige qué notificaciones quieres recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const key = type.key as keyof typeof preferences;
            const enabled = preferences[key] !== false;

            return (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Label htmlFor={type.key} className="font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={enabled}
                  onCheckedChange={(checked) => handleToggleType(type.key, checked)}
                  disabled={updatePreferences.isPending}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canales de notificación</CardTitle>
          <CardDescription>
            Cómo quieres recibir las notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="push" className="font-medium cursor-pointer">
                  Notificaciones push
                </Label>
                <p className="text-sm text-muted-foreground">
                  En tu navegador o dispositivo móvil
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={preferences.channels?.push !== false}
              onCheckedChange={(checked) => handleToggleChannel('push', checked)}
              disabled={updatePreferences.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="email" className="font-medium cursor-pointer">
                  Correo electrónico
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibe un resumen por email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={preferences.channels?.email === true}
              onCheckedChange={(checked) => handleToggleChannel('email', checked)}
              disabled={updatePreferences.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Horas de silencio
          </CardTitle>
          <CardDescription>
            No recibir notificaciones push durante estas horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart">Inicio</Label>
              <Input
                id="quietStart"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-32"
              />
            </div>
            <span className="pb-2 text-muted-foreground">a</span>
            <div className="space-y-2">
              <Label htmlFor="quietEnd">Fin</Label>
              <Input
                id="quietEnd"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-32"
              />
            </div>
            <Button
              onClick={handleSaveQuietHours}
              disabled={updateQuietHours.isPending}
            >
              {updateQuietHours.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar
            </Button>
          </div>
          {quietStart && quietEnd && (
            <p className="text-sm text-muted-foreground mt-3">
              No recibirás notificaciones push entre las {quietStart} y las {quietEnd}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Registered Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos registrados</CardTitle>
          <CardDescription>
            Dispositivos donde recibes notificaciones push
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : devices && devices.length > 0 ? (
            <div className="space-y-3">
              {devices.map((device) => {
                const Icon = deviceIcons[device.deviceType] || Monitor;

                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {device.deviceName || `Dispositivo ${device.deviceType}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {device.lastUsedAt
                            ? `Última actividad ${formatDistanceToNow(new Date(device.lastUsedAt), { addSuffix: true, locale: es })}`
                            : `Registrado ${formatDistanceToNow(new Date(device.createdAt), { addSuffix: true, locale: es })}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDevice(device.deviceId)}
                      disabled={unregisterDevice.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Smartphone className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No hay dispositivos registrados</p>
              <p className="text-sm mt-1">
                Activa las notificaciones push para registrar este dispositivo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
