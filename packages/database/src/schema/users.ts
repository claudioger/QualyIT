import { pgTable, uuid, varchar, text, timestamp, time, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums';
import { tenants } from './tenants';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('employee'),
    notificationPreferences: jsonb('notification_preferences')
      .default({})
      .$type<NotificationPreferences>(),
    quietHoursStart: time('quiet_hours_start'),
    quietHoursEnd: time('quiet_hours_end'),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('users_tenant_id_idx').on(table.tenantId),
    emailTenantIdx: index('users_email_tenant_idx').on(table.tenantId, table.email),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export interface NotificationPreferences {
  taskAssigned?: boolean;
  taskReminder?: boolean;
  taskOverdue?: boolean;
  problemReported?: boolean;
  channels?: {
    push?: boolean;
    email?: boolean;
  };
}

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
