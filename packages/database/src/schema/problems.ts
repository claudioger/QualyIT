import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { problemReasonEnum, problemStatusEnum } from './enums';
import { tenants } from './tenants';
import { taskCompletions } from './task-completions';
import { tasks } from './tasks';
import { users } from './users';

export const problems = pgTable(
  'problems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskCompletionId: uuid('task_completion_id')
      .notNull()
      .references(() => taskCompletions.id, { onDelete: 'cascade' }),
    reasonCategory: problemReasonEnum('reason_category').notNull(),
    description: text('description'),
    status: problemStatusEnum('status').notNull().default('open'),
    correctiveTaskId: uuid('corrective_task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedById: uuid('resolved_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('problems_tenant_id_idx').on(table.tenantId),
    statusIdx: index('problems_status_idx').on(table.status),
    taskCompletionIdIdx: index('problems_task_completion_id_idx').on(table.taskCompletionId),
  })
);

export const problemsRelations = relations(problems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [problems.tenantId],
    references: [tenants.id],
  }),
  taskCompletion: one(taskCompletions, {
    fields: [problems.taskCompletionId],
    references: [taskCompletions.id],
  }),
  correctiveTask: one(tasks, {
    fields: [problems.correctiveTaskId],
    references: [tasks.id],
  }),
  resolvedBy: one(users, {
    fields: [problems.resolvedById],
    references: [users.id],
  }),
}));

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
