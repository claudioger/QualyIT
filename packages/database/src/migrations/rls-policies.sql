-- ===========================================
-- QualyIT Row-Level Security Policies
-- ===========================================
-- This file must be run AFTER the initial migration
-- All tables filter by tenant_id using the app.current_tenant_id setting

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policy
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Areas policy
CREATE POLICY areas_tenant_isolation ON areas
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Area Users policy
CREATE POLICY area_users_tenant_isolation ON area_users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Tasks policy
CREATE POLICY tasks_tenant_isolation ON tasks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Checklist Items policy
CREATE POLICY checklist_items_tenant_isolation ON checklist_items
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Task Completions policy
CREATE POLICY task_completions_tenant_isolation ON task_completions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Problems policy
CREATE POLICY problems_tenant_isolation ON problems
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Uploaded Files policy
CREATE POLICY uploaded_files_tenant_isolation ON uploaded_files
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Notifications policy
CREATE POLICY notifications_tenant_isolation ON notifications
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Push Subscriptions policy
CREATE POLICY push_subscriptions_tenant_isolation ON push_subscriptions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grant execute to set the tenant context
-- This should be called at the start of each request:
-- SET LOCAL app.current_tenant_id = 'uuid-here';

-- Note: The tenants table does NOT have RLS enabled
-- because tenant lookups happen before authentication
-- (subdomain resolution, organization lookup)
