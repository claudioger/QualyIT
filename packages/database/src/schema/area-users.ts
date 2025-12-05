import { pgTable, uuid, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { areas } from './areas';
import { users } from './users';

export const areaUsers = pgTable(
  'area_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    areaUserUnique: uniqueIndex('area_users_area_user_unique').on(table.areaId, table.userId),
    tenantIdIdx: index('area_users_tenant_id_idx').on(table.tenantId),
  })
);

export const areaUsersRelations = relations(areaUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [areaUsers.tenantId],
    references: [tenants.id],
  }),
  area: one(areas, {
    fields: [areaUsers.areaId],
    references: [areas.id],
  }),
  user: one(users, {
    fields: [areaUsers.userId],
    references: [users.id],
  }),
}));

export type AreaUser = typeof areaUsers.$inferSelect;
export type NewAreaUser = typeof areaUsers.$inferInsert;
