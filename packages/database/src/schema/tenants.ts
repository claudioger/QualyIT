import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { planTypeEnum } from './enums';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 63 }).unique().notNull(),
  subdomain: varchar('subdomain', { length: 63 }).unique().notNull(),
  plan: planTypeEnum('plan').notNull().default('free'),
  settings: jsonb('settings').default({}).$type<TenantSettings>(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export interface TenantSettings {
  timezone?: string;
  locale?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
