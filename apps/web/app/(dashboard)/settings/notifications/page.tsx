import { NotificationPreferences } from '@/components/notifications';

export default function NotificationSettingsPage() {
  return (
    <div className="container py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">
          Configura cómo y cuándo quieres recibir notificaciones
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
