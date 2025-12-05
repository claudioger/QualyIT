import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

export const areas = pgTable(
  'areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }),
    responsibleId: uuid('responsible_id').references(() => users.id, { onDelete: 'set null' }),
    backupResponsibleId: uuid('backup_responsible_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    settings: jsonb('settings').default({}).$type<AreaSettings>(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('areas_tenant_id_idx').on(table.tenantId),
    parentIdIdx: index('areas_parent_id_idx').on(table.parentId),
    responsibleIdIdx: index('areas_responsible_id_idx').on(table.responsibleId),
  })
);

export const areasRelations = relations(areas, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [areas.tenantId],
    references: [tenants.id],
  }),
  parent: one(areas, {
    fields: [areas.parentId],
    references: [areas.id],
    relationName: 'areaHierarchy',
  }),
  children: many(areas, {
    relationName: 'areaHierarchy',
  }),
  responsible: one(users, {
    fields: [areas.responsibleId],
    references: [users.id],
    relationName: 'areaResponsible',
  }),
  backupResponsible: one(users, {
    fields: [areas.backupResponsibleId],
    references: [users.id],
    relationName: 'areaBackupResponsible',
  }),
}));

export interface AreaSettings {
  defaultTaskPriority?: 'critical' | 'high' | 'medium' | 'low';
  requirePhotoOnProblem?: boolean;
}

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;
