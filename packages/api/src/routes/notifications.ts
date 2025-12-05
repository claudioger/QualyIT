import { Hono } from 'hono';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb } from '../lib/db';
import { notifications, pushSubscriptions, users } from '@qualyit/database/schema';
import { paginationSchema } from '@qualyit/shared/validators';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

const pushSubscriptionSchema = z.object({
  deviceId: z.string().min(1),
  deviceType: z.enum(['web', 'android', 'ios']),
  deviceName: z.string().optional(),
  endpoint: z.string().url(),
  p256dh: z.string().optional(),
  auth: z.string().optional(),
  fcmToken: z.string().optional(),
  userAgent: z.string().optional(),
});

const notificationPreferencesSchema = z.object({
  taskAssigned: z.boolean().optional(),
  taskReminder: z.boolean().optional(),
  taskOverdue: z.boolean().optional(),
  problemReported: z.boolean().optional(),
  channels: z.object({
    push: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
});

const quietHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
});

export const notificationsRoutes = new Hono<Env>();

// GET /api/notifications - List user's notifications
notificationsRoutes.get('/', zValidator('query', paginationSchema.partial()), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const { page = 1, pageSize = 20 } = c.req.valid('query');
  const unreadOnly = c.req.query('unread') === 'true';
  const db = getDb();

  const conditions = [
    eq(notifications.tenantId, tenantId),
    eq(notifications.userId, userId),
  ];

  if (unreadOnly) {
    conditions.push(isNull(notifications.readAt));
  }

  const userNotifications = await db.query.notifications.findMany({
    where: and(...conditions),
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: [desc(notifications.createdAt)],
  });

  // Get unread count
  const unreadCount = await db.query.notifications.findMany({
    where: and(
      eq(notifications.tenantId, tenantId),
      eq(notifications.userId, userId),
      isNull(notifications.readAt)
    ),
    columns: { id: true },
  });

  return c.json({
    success: true,
    data: {
      items: userNotifications,
      page,
      pageSize,
      hasMore: userNotifications.length === pageSize,
      unreadCount: unreadCount.length,
    },
  });
});

// POST /api/notifications/mark-read - Mark notifications as read
notificationsRoutes.post('/mark-read', zValidator('json', markReadSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const body = c.req.valid('json');
  const db = getDb();

  const now = new Date();

  if (body.all) {
    // Mark all as read
    await db
      .update(notifications)
      .set({ readAt: now })
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.userId, userId),
          isNull(notifications.readAt)
        )
      );
  } else if (body.notificationIds && body.notificationIds.length > 0) {
    // Mark specific notifications as read
    for (const notificationId of body.notificationIds) {
      await db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.tenantId, tenantId),
            eq(notifications.userId, userId)
          )
        );
    }
  }

  return c.json({ success: true, data: { marked: true } });
});

// DELETE /api/notifications/:id - Delete a notification
notificationsRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  const db = getDb();

  const [deleted] = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId)
      )
    )
    .returning({ id: notifications.id });

  if (!deleted) {
    throw Errors.notFound('Notificación');
  }

  return c.json({ success: true, data: { id: notificationId } });
});

// POST /api/notifications/push-subscription - Register push subscription
notificationsRoutes.post(
  '/push-subscription',
  zValidator('json', pushSubscriptionSchema),
  async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const db = getDb();

    // Upsert push subscription
    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.deviceId, body.deviceId)
      ),
    });

    if (existing) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          endpoint: body.endpoint,
          p256dh: body.p256dh,
          auth: body.auth,
          fcmToken: body.fcmToken,
          deviceName: body.deviceName,
          userAgent: body.userAgent,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        tenantId,
        userId,
        deviceId: body.deviceId,
        deviceType: body.deviceType,
        deviceName: body.deviceName,
        endpoint: body.endpoint,
        p256dh: body.p256dh,
        auth: body.auth,
        fcmToken: body.fcmToken,
        userAgent: body.userAgent,
      });
    }

    return c.json({
      success: true,
      data: { subscribed: true, deviceId: body.deviceId },
    });
  }
);

// DELETE /api/notifications/push-subscription/:deviceId - Unregister push subscription
notificationsRoutes.delete('/push-subscription/:deviceId', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const deviceId = c.req.param('deviceId');
  const db = getDb();

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.tenantId, tenantId),
        eq(pushSubscriptions.deviceId, deviceId)
      )
    );

  return c.json({
    success: true,
    data: { unsubscribed: true, deviceId },
  });
});

// GET /api/notifications/devices - List user's registered devices
notificationsRoutes.get('/devices', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const db = getDb();

  const devices = await db.query.pushSubscriptions.findMany({
    where: and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.tenantId, tenantId)
    ),
    columns: {
      id: true,
      deviceId: true,
      deviceType: true,
      deviceName: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: [desc(pushSubscriptions.lastUsedAt)],
  });

  return c.json({
    success: true,
    data: devices,
  });
});

// GET /api/notifications/preferences - Get user's notification preferences
notificationsRoutes.get('/preferences', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.get('userId');
  const db = getDb();

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    columns: {
      notificationPreferences: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  });

  if (!user) {
    throw Errors.notFound('Usuario');
  }

  return c.json({
    success: true,
    data: {
      preferences: user.notificationPreferences || {
        taskAssigned: true,
        taskReminder: true,
        taskOverdue: true,
        problemReported: true,
        channels: { push: true, email: false },
      },
      quietHours: {
        start: user.quietHoursStart,
        end: user.quietHoursEnd,
      },
    },
  });
});

// PUT /api/notifications/preferences - Update notification preferences
notificationsRoutes.put(
  '/preferences',
  zValidator('json', notificationPreferencesSchema),
  async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const db = getDb();

    await db
      .update(users)
      .set({
        notificationPreferences: body,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    return c.json({
      success: true,
      data: { preferences: body },
    });
  }
);

// PUT /api/notifications/quiet-hours - Update quiet hours
notificationsRoutes.put(
  '/quiet-hours',
  zValidator('json', quietHoursSchema),
  async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const db = getDb();

    await db
      .update(users)
      .set({
        quietHoursStart: body.start,
        quietHoursEnd: body.end,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    return c.json({
      success: true,
      data: { quietHours: body },
    });
  }
);
