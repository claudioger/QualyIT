import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Types
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    taskId?: string;
    areaId?: string;
    problemId?: string;
    deepLink?: string;
  };
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  unreadCount: number;
}

interface NotificationPreferences {
  taskAssigned?: boolean;
  taskReminder?: boolean;
  taskOverdue?: boolean;
  problemReported?: boolean;
  channels?: {
    push?: boolean;
    email?: boolean;
  };
}

interface QuietHours {
  start: string | null;
  end: string | null;
}

interface PreferencesResponse {
  preferences: NotificationPreferences;
  quietHours: QuietHours;
}

interface Device {
  id: string;
  deviceId: string;
  deviceType: 'web' | 'android' | 'ios';
  deviceName: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; unread?: boolean }) =>
    [...notificationKeys.all, 'list', params] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
  devices: () => [...notificationKeys.all, 'devices'] as const,
};

// Hooks

/**
 * Get notifications list
 */
export function useNotifications(params?: { page?: number; unread?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const response = await api.get<NotificationsResponse>('/notifications', {
        page: params?.page,
        unread: params?.unread,
      });
      return response.data;
    },
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: async () => {
      const response = await api.get<PreferencesResponse>('/notifications/preferences');
      return response.data;
    },
  });
}

/**
 * Get registered devices
 */
export function useDevices() {
  return useQuery({
    queryKey: notificationKeys.devices(),
    queryFn: async () => {
      const response = await api.get<Device[]>('/notifications/devices');
      return response.data;
    },
  });
}

/**
 * Mark notifications as read
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { notificationIds?: string[]; all?: boolean }) => {
      const response = await api.post<{ marked: boolean }>('/notifications/mark-read', params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete<{ id: string }>(`/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const response = await api.put<{ preferences: NotificationPreferences }>(
        '/notifications/preferences',
        preferences
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

/**
 * Update quiet hours
 */
export function useUpdateQuietHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quietHours: QuietHours) => {
      const response = await api.put<{ quietHours: QuietHours }>(
        '/notifications/quiet-hours',
        quietHours
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

/**
 * Register push subscription
 */
export function useRegisterPushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscription: {
      deviceId: string;
      deviceType: 'web' | 'android' | 'ios';
      deviceName?: string;
      endpoint: string;
      p256dh?: string;
      auth?: string;
      fcmToken?: string;
      userAgent?: string;
    }) => {
      const response = await api.post<{ subscribed: boolean; deviceId: string }>(
        '/notifications/push-subscription',
        subscription
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
}

/**
 * Unregister push subscription
 */
export function useUnregisterDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await api.delete<{ unsubscribed: boolean; deviceId: string }>(
        `/notifications/push-subscription/${deviceId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    },
  });
}
