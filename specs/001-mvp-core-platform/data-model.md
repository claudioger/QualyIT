# Data Model: MVP Core Platform

**Feature**: 001-mvp-core-platform
**Date**: 2025-12-03

## Overview

This document defines the database schema for QualyIT MVP. All tables include `tenant_id` for
Row-Level Security. The schema uses Drizzle ORM conventions.

---

## Entity Relationship Diagram

```
┌─────────────┐
│   Tenant    │
└──────┬──────┘
       │ 1:N
       ├────────────────┬────────────────┬────────────────┐
       │                │                │                │
       ▼                ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    User     │  │    Area     │  │    Task     │  │ Notification│
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────┘
       │                │                │
       │                │ self-ref       │
       │                │ (parent)       │
       │                │                │
       │         ┌──────┴──────┐         │
       │         │             │         │
       │         ▼             │         ▼
       │  ┌─────────────┐      │  ┌─────────────┐
       │  │  AreaUser   │◄─────┘  │ChecklistItem│
       │  │  (junction) │         └─────────────┘
       │  └─────────────┘
       │         ▲
       └─────────┘

       Task ────────► TaskCompletion ────────► Problem
                           │
                           └──► UploadedFile
```

---

## Entities

### 1. Tenant

Represents an organization using QualyIT (hotel, restaurant, etc.).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization display name |
| slug | VARCHAR(63) | UNIQUE, NOT NULL | URL-safe identifier |
| subdomain | VARCHAR(63) | UNIQUE, NOT NULL | e.g., "termas" for termas.qualyit.app |
| plan | ENUM | NOT NULL, default 'free' | 'free', 'pro', 'enterprise' |
| settings | JSONB | default '{}' | Tenant-specific configuration |
| clerk_org_id | VARCHAR(255) | UNIQUE | Clerk organization ID |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | Last update timestamp |

**Indexes**: `slug`, `subdomain`, `clerk_org_id`

---

### 2. User

A person with access to the system. Synced from Clerk via webhooks.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| clerk_user_id | VARCHAR(255) | UNIQUE, NOT NULL | Clerk user ID |
| email | VARCHAR(255) | NOT NULL | Email address |
| name | VARCHAR(255) | NOT NULL | Display name |
| avatar_url | TEXT | | Profile photo URL |
| role | ENUM | NOT NULL, default 'employee' | 'admin', 'manager', 'supervisor', 'employee' |
| notification_preferences | JSONB | default '{}' | Push notification settings |
| quiet_hours_start | TIME | | Start of quiet hours (local) |
| quiet_hours_end | TIME | | End of quiet hours (local) |
| is_active | BOOLEAN | NOT NULL, default true | Soft delete flag |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `tenant_id`, `clerk_user_id`, `email` (within tenant)

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 3. Area

Organizational unit within a tenant. Supports unlimited hierarchy.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| parent_id | UUID | FK → Area, NULL | Parent area for hierarchy |
| name | VARCHAR(255) | NOT NULL | Area display name |
| code | VARCHAR(50) | | Optional short code (e.g., "COC") |
| responsible_id | UUID | FK → User | Primary responsible person |
| backup_responsible_id | UUID | FK → User | Backup responsible |
| settings | JSONB | default '{}' | Area-specific settings |
| sort_order | INTEGER | NOT NULL, default 0 | Display order among siblings |
| is_active | BOOLEAN | NOT NULL, default true | Soft delete flag |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `tenant_id`, `parent_id`, `responsible_id`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 4. AreaUser (Junction)

Maps users to areas they can access.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| area_id | UUID | FK → Area, NOT NULL | |
| user_id | UUID | FK → User, NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Unique Constraint**: `(area_id, user_id)`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 5. Task

A work item to be completed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| area_id | UUID | FK → Area, NOT NULL | Belongs to area |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | | Optional detailed description |
| type | ENUM | NOT NULL | 'scheduled', 'corrective', 'preventive' |
| priority | ENUM | NOT NULL, default 'medium' | 'critical', 'high', 'medium', 'low' |
| status | ENUM | NOT NULL, default 'pending' | 'pending', 'in_progress', 'completed', 'cancelled' |
| assigned_to_id | UUID | FK → User | Assigned user |
| created_by_id | UUID | FK → User, NOT NULL | Creator |
| due_date | TIMESTAMPTZ | | When task is due |
| scheduled_time | TIME | | Time of day for scheduled tasks |
| recurrence_rule | JSONB | | Recurrence pattern (cron-like) |
| parent_task_id | UUID | FK → Task | For corrective tasks linked to problems |
| has_checklist | BOOLEAN | NOT NULL, default false | Whether task has checklist items |
| completed_at | TIMESTAMPTZ | | When completed |
| completed_by_id | UUID | FK → User | Who completed |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `tenant_id`, `area_id`, `assigned_to_id`, `status`, `due_date`, `(tenant_id, status, due_date)`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 6. ChecklistItem

Individual verification item within a task.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| task_id | UUID | FK → Task, NOT NULL, ON DELETE CASCADE | Parent task |
| description | VARCHAR(500) | NOT NULL | What to verify |
| sort_order | INTEGER | NOT NULL, default 0 | Display order |
| status | ENUM | NOT NULL, default 'pending' | 'pending', 'ok', 'problem' |
| completed_at | TIMESTAMPTZ | | When checked |
| completed_by_id | UUID | FK → User | Who checked |
| problem_reason | VARCHAR(255) | | If status='problem', why |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `task_id`, `status`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 7. TaskCompletion

Record of a task or checklist item being completed.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| task_id | UUID | FK → Task, NOT NULL | Completed task |
| checklist_item_id | UUID | FK → ChecklistItem | If completing checklist item |
| user_id | UUID | FK → User, NOT NULL | Who completed |
| status | ENUM | NOT NULL | 'ok', 'problem' |
| notes | TEXT | | Optional notes (voice-to-text) |
| completed_at | TIMESTAMPTZ | NOT NULL, default now() | |
| synced_at | TIMESTAMPTZ | | When synced (for offline) |
| offline_id | VARCHAR(255) | | Client-side ID for dedup |

**Indexes**: `task_id`, `user_id`, `completed_at`, `offline_id`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 8. Problem

An issue reported during task completion.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| task_completion_id | UUID | FK → TaskCompletion, NOT NULL | Source completion |
| reason_category | ENUM | NOT NULL | 'no_time', 'no_supplies', 'equipment_broken', 'other' |
| description | TEXT | | Additional details |
| status | ENUM | NOT NULL, default 'open' | 'open', 'assigned', 'resolved' |
| corrective_task_id | UUID | FK → Task | Auto-created corrective task |
| resolved_at | TIMESTAMPTZ | | When resolved |
| resolved_by_id | UUID | FK → User | Who resolved |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `tenant_id`, `status`, `task_completion_id`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 9. UploadedFile

Files (photos) attached to completions or problems.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| task_completion_id | UUID | FK → TaskCompletion | If attached to completion |
| problem_id | UUID | FK → Problem | If attached to problem |
| storage_key | VARCHAR(500) | NOT NULL | R2 object key |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| content_type | VARCHAR(100) | NOT NULL | MIME type |
| size_bytes | INTEGER | NOT NULL | File size |
| uploaded_at | TIMESTAMPTZ | NOT NULL, default now() | |
| synced_at | TIMESTAMPTZ | | When synced (for offline) |

**Check Constraint**: `task_completion_id IS NOT NULL OR problem_id IS NOT NULL`

**Indexes**: `task_completion_id`, `problem_id`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

### 10. Notification

Push/in-app notifications sent to users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique identifier |
| tenant_id | UUID | FK → Tenant, NOT NULL | Owning tenant (RLS) |
| user_id | UUID | FK → User, NOT NULL | Recipient |
| type | ENUM | NOT NULL | 'task_assigned', 'task_reminder', 'task_overdue', 'problem_reported' |
| title | VARCHAR(255) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body |
| data | JSONB | default '{}' | Deep link data |
| read_at | TIMESTAMPTZ | | When read |
| sent_at | TIMESTAMPTZ | | When sent via FCM |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

**Indexes**: `user_id`, `read_at`, `created_at`

**RLS Policy**: `tenant_id = current_setting('app.current_tenant_id')::uuid`

---

## Enums

```sql
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'supervisor', 'employee');
CREATE TYPE task_type AS ENUM ('scheduled', 'corrective', 'preventive');
CREATE TYPE task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE checklist_status AS ENUM ('pending', 'ok', 'problem');
CREATE TYPE completion_status AS ENUM ('ok', 'problem');
CREATE TYPE problem_reason AS ENUM ('no_time', 'no_supplies', 'equipment_broken', 'other');
CREATE TYPE problem_status AS ENUM ('open', 'assigned', 'resolved');
CREATE TYPE notification_type AS ENUM ('task_assigned', 'task_reminder', 'task_overdue', 'problem_reported');
```

---

## State Transitions

### Task Status

```
pending ──► in_progress ──► completed
    │            │
    │            ▼
    └────────► cancelled
```

### Problem Status

```
open ──► assigned ──► resolved
```

### Checklist Item Status

```
pending ──► ok
    │
    └────► problem
```

---

## Recurrence Rule Schema (JSONB)

```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;        // Every N days/weeks/months
  daysOfWeek?: number[];   // 0-6 for weekly (0=Sunday)
  dayOfMonth?: number;     // 1-31 for monthly
  endDate?: string;        // ISO date, optional end
  timezone: string;        // e.g., 'America/Argentina/Buenos_Aires'
}

// Example: Every weekday at 7:00
{
  "frequency": "weekly",
  "interval": 1,
  "daysOfWeek": [1, 2, 3, 4, 5],
  "timezone": "America/Argentina/Buenos_Aires"
}
```

---

## Notification Preferences Schema (JSONB)

```typescript
interface NotificationPreferences {
  taskAssigned: boolean;
  taskReminder: boolean;
  taskOverdue: boolean;
  problemReported: boolean;
  channels: {
    push: boolean;
    email: boolean;
  };
}
```

---

## Indexes Summary

Critical indexes for query performance:

1. **Task list by user**: `(tenant_id, assigned_to_id, status, due_date)`
2. **Area dashboard**: `(tenant_id, area_id, status)`
3. **Overdue detection**: `(tenant_id, status, due_date) WHERE status = 'pending'`
4. **Offline sync**: `(tenant_id, updated_at)`
