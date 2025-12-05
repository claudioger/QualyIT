'use client';

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
} from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  onClose?: () => void;
}

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

export function NotificationList({ onClose }: NotificationListProps) {
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const handleNotificationClick = (notification: NonNullable<typeof data>['items'][0]) => {
    // Mark as read
    if (!notification.readAt) {
      markRead.mutate({ notificationIds: [notification.id] });
    }

    // Navigate to deep link
    if (notification.data?.deepLink) {
      router.push(notification.data.deepLink);
    } else if (notification.data?.taskId) {
      router.push(`/tasks/${notification.data.taskId}`);
    } else if (notification.data?.areaId) {
      router.push(`/areas/${notification.data.areaId}`);
    }

    onClose?.();
  };

  const handleMarkAllRead = () => {
    markRead.mutate({ all: true });
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const notifications = data?.items || [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Notificaciones</h3>
        <div className="flex items-center gap-1">
          {data?.unreadCount ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markRead.isPending}
              className="text-xs"
            >
              {markRead.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              Marcar todas
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              router.push('/settings/notifications');
              onClose?.();
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="max-h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-50';

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors group',
                    !notification.readAt && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn('flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm',
                        !notification.readAt && 'font-medium'
                      )}>
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && data?.hasMore && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              router.push('/notifications');
              onClose?.();
            }}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </div>
  );
}
