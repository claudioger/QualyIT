import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  time,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { taskTypeEnum, taskPriorityEnum, taskStatusEnum } from './enums';
import { tenants } from './tenants';
import { areas } from './areas';
import { users } from './users';

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: taskTypeEnum('type').notNull(),
    priority: taskPriorityEnum('priority').notNull().default('medium'),
    status: taskStatusEnum('status').notNull().default('pending'),
    assignedToId: uuid('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id),
    dueDate: timestamp('due_date', { withTimezone: true }),
    scheduledTime: time('scheduled_time'),
    recurrenceRule: jsonb('recurrence_rule').$type<RecurrenceRule>(),
    parentTaskId: uuid('parent_task_id'),
    hasChecklist: boolean('has_checklist').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedById: uuid('completed_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('tasks_tenant_id_idx').on(table.tenantId),
    areaIdIdx: index('tasks_area_id_idx').on(table.areaId),
    assignedToIdIdx: index('tasks_assigned_to_id_idx').on(table.assignedToId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
    tenantStatusDueDateIdx: index('tasks_tenant_status_due_date_idx').on(
      table.tenantId,
      table.status,
      table.dueDate
    ),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [tasks.tenantId],
    references: [tenants.id],
  }),
  area: one(areas, {
    fields: [tasks.areaId],
    references: [areas.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: 'taskAssignedTo',
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'taskCreatedBy',
  }),
  completedBy: one(users, {
    fields: [tasks.completedById],
    references: [users.id],
    relationName: 'taskCompletedBy',
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'taskHierarchy',
  }),
  childTasks: many(tasks, {
    relationName: 'taskHierarchy',
  }),
}));

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  timezone: string;
}

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
