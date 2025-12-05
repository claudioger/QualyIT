import { pgTable, uuid, varchar, integer, timestamp, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { tenants } from './tenants';
import { taskCompletions } from './task-completions';
import { problems } from './problems';

export const uploadedFiles = pgTable(
  'uploaded_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    taskCompletionId: uuid('task_completion_id').references(() => taskCompletions.id, {
      onDelete: 'cascade',
    }),
    problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }),
    storageKey: varchar('storage_key', { length: 500 }).notNull(),
    filename: varchar('filename', { length: 255 }).notNull(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
  },
  (table) => ({
    taskCompletionIdIdx: index('uploaded_files_task_completion_id_idx').on(table.taskCompletionId),
    problemIdIdx: index('uploaded_files_problem_id_idx').on(table.problemId),
    hasParentCheck: check(
      'uploaded_files_has_parent',
      sql`${table.taskCompletionId} IS NOT NULL OR ${table.problemId} IS NOT NULL`
    ),
  })
);

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [uploadedFiles.tenantId],
    references: [tenants.id],
  }),
  taskCompletion: one(taskCompletions, {
    fields: [uploadedFiles.taskCompletionId],
    references: [taskCompletions.id],
  }),
  problem: one(problems, {
    fields: [uploadedFiles.problemId],
    references: [problems.id],
  }),
}));

export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type NewUploadedFile = typeof uploadedFiles.$inferInsert;
