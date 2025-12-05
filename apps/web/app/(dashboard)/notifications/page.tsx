'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertCircle,
  Trash2,
  CheckCheck,
  Settings,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
} from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task_assigned: Bell,
  task_reminder: Clock,
  task_overdue: AlertTriangle,
  problem_reported: AlertCircle,
  task_completed: CheckCircle2,
};

const notificationColors: Record<string, string> = {
  task_assigned: 'text-blue-500 bg-blue-50',
  task_reminder: 'text-yellow-500 bg-yellow-50',
  task_overdue: 'text-red-500 bg-red-50',
  problem_reported: 'text-orange-500 bg-orange-50',
  task_completed: 'text-green-500 bg-green-50',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useNotifications({ unread: filter === 'unread' });
  const markRead = useMarkNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: NonNullable<typeof data>['items'][0]) => {
    if (!notification.readAt) {
      markRead.mutate({ notificationIds: [notification.id] });
    }

    if (notification.data?.deepLink) {
      router.push(notification.data.deepLink);
    } else if (notification.data?.taskId) {
      router.push(`/tasks/${notification.data.taskId}`);
    } else if (notification.data?.areaId) {
      router.push(`/areas/${notification.data.areaId}`);
    }
  };

  const handleMarkAllRead = () => {
    markRead.mutate({ all: true });
  };

  const notifications = data?.items || [];

  return (
    <div className="container py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground">
            {data?.unreadCount
              ? `${data.unreadCount} sin leer`
              : 'Todas las notificaciones leídas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.unreadCount ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markRead.isPending}
            >
              {markRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Marcar todas como leídas
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/settings/notifications')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            Todas
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <Bell className="h-4 w-4" />
            Sin leer
            {data?.unreadCount ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                {data.unreadCount}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">
            {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
          </h3>
          <p className="mt-1">
            {filter === 'unread'
              ? 'Todas tus notificaciones han sido leídas'
              : 'Las notificaciones aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-50';

            return (
              <div
                key={notification.id}
                className={cn(
                  'flex gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors group',
                  !notification.readAt && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className={cn(
                    'flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center',
                    colorClass
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('font-medium', !notification.readAt && 'text-primary')}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification.mutate(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                {!notification.readAt && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                )}
              </div>
            );
          })}

          {data?.hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline">Cargar más</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
