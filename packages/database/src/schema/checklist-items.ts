import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { checklistStatusEnum } from './enums';
import { tenants } from './tenants';
import { tasks } from './tasks';
import { users } from './users';

export const checklistItems = pgTable(
  'checklist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 500 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    status: checklistStatusEnum('status').notNull().default('pending'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedById: uuid('completed_by_id').references(() => users.id, { onDelete: 'set null' }),
    problemReason: varchar('problem_reason', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index('checklist_items_task_id_idx').on(table.taskId),
    statusIdx: index('checklist_items_status_idx').on(table.status),
  })
);

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [checklistItems.tenantId],
    references: [tenants.id],
  }),
  task: one(tasks, {
    fields: [checklistItems.taskId],
    references: [tasks.id],
  }),
  completedBy: one(users, {
    fields: [checklistItems.completedById],
    references: [users.id],
  }),
}));

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;
