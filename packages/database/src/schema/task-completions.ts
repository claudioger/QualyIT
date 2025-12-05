import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { completionStatusEnum } from './enums';
import { tenants } from './tenants';
import { tasks } from './tasks';
import { checklistItems } from './checklist-items';
import { users } from './users';

export const taskCompletions = pgTable(
  'task_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    checklistItemId: uuid('checklist_item_id').references(() => checklistItems.id, {
      onDelete: 'cascade',
    }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: completionStatusEnum('status').notNull(),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    offlineId: varchar('offline_id', { length: 255 }),
  },
  (table) => ({
    taskIdIdx: index('task_completions_task_id_idx').on(table.taskId),
    userIdIdx: index('task_completions_user_id_idx').on(table.userId),
    completedAtIdx: index('task_completions_completed_at_idx').on(table.completedAt),
    offlineIdIdx: index('task_completions_offline_id_idx').on(table.offlineId),
  })
);

export const taskCompletionsRelations = relations(taskCompletions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [taskCompletions.tenantId],
    references: [tenants.id],
  }),
  task: one(tasks, {
    fields: [taskCompletions.taskId],
    references: [tasks.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [taskCompletions.checklistItemId],
    references: [checklistItems.id],
  }),
  user: one(users, {
    fields: [taskCompletions.userId],
    references: [users.id],
  }),
}));

export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type NewTaskCompletion = typeof taskCompletions.$inferInsert;
