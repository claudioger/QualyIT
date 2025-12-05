import { eq, and } from 'drizzle-orm';
import { getDb } from '../lib/db';
import { notifications, users, pushSubscriptions } from '@qualyit/database/schema';
import type { NewNotification, NotificationPreferences } from '@qualyit/database/schema';

// Must match the notification_type enum in the database
export type NotificationType =
  | 'task_assigned'
  | 'task_reminder'
  | 'task_overdue'
  | 'problem_reported';

interface SendNotificationOptions {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    taskId?: string;
    areaId?: string;
    problemId?: string;
    deepLink?: string;
  };
  // Skip preference check (for critical notifications)
  force?: boolean;
}

interface NotificationResult {
  notificationId: string;
  pushSent: boolean;
  reason?: string;
}

/**
 * Check if a user is within their quiet hours
 */
function isInQuietHours(quietStart: string | null, quietEnd: string | null): boolean {
  if (!quietStart || !quietEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if user wants this notification type
 */
function shouldSendNotification(
  type: NotificationType,
  preferences: NotificationPreferences | null
): boolean {
  if (!preferences) return true; // Default to sending

  switch (type) {
    case 'task_assigned':
      return preferences.taskAssigned !== false;
    case 'task_reminder':
      return preferences.taskReminder !== false;
    case 'task_overdue':
      return preferences.taskOverdue !== false;
    case 'problem_reported':
      return preferences.problemReported !== false;
    default:
      return true;
  }
}

/**
 * Send notification to a user
 * - Creates database record
 * - Sends push notification if enabled and user has subscriptions
 * - Respects quiet hours and user preferences
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<NotificationResult> {
  const { tenantId, userId, type, title, body, data, force } = options;
  const db = getDb();

  // Get user preferences
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    columns: {
      id: true,
      notificationPreferences: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Check if we should send based on preferences
  if (!force && !shouldSendNotification(type, user.notificationPreferences)) {
    // Still create DB record but mark as not sent via push
    const [notification] = await db
      .insert(notifications)
      .values({
        tenantId,
        userId,
        type,
        title,
        body,
        data: data || {},
      })
      .returning();

    return {
      notificationId: notification.id,
      pushSent: false,
      reason: 'User preferences disabled',
    };
  }

  // Create notification in database
  const [notification] = await db
    .insert(notifications)
    .values({
      tenantId,
      userId,
      type,
      title,
      body,
      data: data || {},
    })
    .returning();

  // Check quiet hours (unless forced)
  const inQuietHours = !force && isInQuietHours(
    user.quietHoursStart as string | null,
    user.quietHoursEnd as string | null
  );

  if (inQuietHours) {
    return {
      notificationId: notification.id,
      pushSent: false,
      reason: 'User in quiet hours',
    };
  }

  // Check if push is enabled in preferences
  const pushEnabled = user.notificationPreferences?.channels?.push !== false;
  if (!force && !pushEnabled) {
    return {
      notificationId: notification.id,
      pushSent: false,
      reason: 'Push notifications disabled',
    };
  }

  // Get user's push subscriptions
  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.tenantId, tenantId)
    ),
  });

  if (subscriptions.length === 0) {
    return {
      notificationId: notification.id,
      pushSent: false,
      reason: 'No push subscriptions',
    };
  }

  // Send push notifications to all devices
  let pushSent = false;
  for (const subscription of subscriptions) {
    try {
      await sendPushToDevice(subscription, {
        title,
        body,
        data: {
          ...data,
          notificationId: notification.id,
          type,
        },
      });
      pushSent = true;

      // Update last used timestamp
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, subscription.id));
    } catch (error) {
      console.error(`Failed to send push to device ${subscription.deviceId}:`, error);
      // If push fails with invalid token, remove the subscription
      if (error instanceof Error && error.message.includes('invalid')) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, subscription.id));
      }
    }
  }

  // Update notification sent status
  if (pushSent) {
    await db
      .update(notifications)
      .set({ sentAt: new Date() })
      .where(eq(notifications.id, notification.id));
  }

  return {
    notificationId: notification.id,
    pushSent,
    reason: pushSent ? undefined : 'Push delivery failed',
  };
}

/**
 * Send push notification to a specific device
 * In production, this would integrate with FCM/APNs/Web Push
 */
async function sendPushToDevice(
  subscription: typeof pushSubscriptions.$inferSelect,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  // For Web Push (browser)
  if (subscription.deviceType === 'web' && subscription.endpoint) {
    await sendWebPush(subscription, payload);
    return;
  }

  // For FCM (Android/iOS)
  if (subscription.fcmToken) {
    await sendFCMPush(subscription.fcmToken, payload);
    return;
  }

  throw new Error('No valid push method for subscription');
}

/**
 * Send Web Push notification
 */
async function sendWebPush(
  subscription: typeof pushSubscriptions.$inferSelect,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  // Web Push implementation
  // In production, use web-push library
  const webPushPayload = {
    notification: {
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: payload.data,
      actions: [
        { action: 'open', title: 'Ver' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    },
  };

  // Placeholder for actual web-push send
  // In production:
  // import webpush from 'web-push';
  // await webpush.sendNotification(
  //   { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
  //   JSON.stringify(webPushPayload)
  // );

  console.log('[WebPush] Would send to:', subscription.endpoint, webPushPayload);
}

/**
 * Send FCM notification
 */
async function sendFCMPush(
  fcmToken: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  // FCM implementation
  // In production, use firebase-admin SDK
  const fcmPayload = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data as Record<string, string>,
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'qualyit_tasks',
        icon: 'ic_notification',
        color: '#6366f1',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  // Placeholder for actual FCM send
  // In production:
  // import admin from 'firebase-admin';
  // await admin.messaging().send(fcmPayload);

  console.log('[FCM] Would send to token:', fcmToken.substring(0, 20) + '...', fcmPayload);
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotifications(
  tenantId: string,
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  data?: SendNotificationOptions['data']
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const userId of userIds) {
    try {
      const result = await sendNotification({
        tenantId,
        userId,
        type,
        title,
        body,
        data,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
    }
  }

  return results;
}

/**
 * Send task reminder notifications for upcoming tasks
 */
export async function sendTaskReminders(
  tenantId: string,
  taskId: string,
  taskTitle: string,
  assignedToId: string,
  minutesUntilDue: number
): Promise<void> {
  const timeText = minutesUntilDue <= 60
    ? `${minutesUntilDue} minutos`
    : `${Math.round(minutesUntilDue / 60)} horas`;

  await sendNotification({
    tenantId,
    userId: assignedToId,
    type: 'task_reminder',
    title: 'Tarea próxima a vencer',
    body: `"${taskTitle}" vence en ${timeText}`,
    data: { taskId },
  });
}

/**
 * Send overdue task notification
 */
export async function sendOverdueNotification(
  tenantId: string,
  taskId: string,
  taskTitle: string,
  assignedToId: string
): Promise<void> {
  await sendNotification({
    tenantId,
    userId: assignedToId,
    type: 'task_overdue',
    title: 'Tarea vencida',
    body: `La tarea "${taskTitle}" está vencida`,
    data: { taskId },
    force: true, // Always send overdue notifications
  });
}

/**
 * Send problem reported notification to supervisors
 */
export async function sendProblemNotification(
  tenantId: string,
  supervisorIds: string[],
  problemId: string,
  taskTitle: string,
  reportedBy: string,
  reason: string
): Promise<void> {
  await sendBulkNotifications(
    tenantId,
    supervisorIds,
    'problem_reported',
    'Problema reportado',
    `${reportedBy} reportó un problema en "${taskTitle}": ${reason}`,
    { problemId }
  );
}
