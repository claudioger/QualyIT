import { pgTable, uuid, varchar, text, timestamp, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Device/browser identification
    deviceId: varchar('device_id', { length: 255 }).notNull(),
    deviceType: varchar('device_type', { length: 50 }).notNull(), // 'web', 'android', 'ios'
    deviceName: varchar('device_name', { length: 255 }),
    // Push subscription data
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh'), // Web Push key
    auth: text('auth'), // Web Push auth
    fcmToken: text('fcm_token'), // Firebase Cloud Messaging token
    // Metadata
    userAgent: text('user_agent'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('push_subscriptions_user_id_idx').on(table.userId),
    deviceIdUnique: unique('push_subscriptions_user_device_unique').on(table.userId, table.deviceId),
  })
);

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pushSubscriptions.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
