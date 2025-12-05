import { pgEnum } from 'drizzle-orm/pg-core';

// Tenant plan types
export const planTypeEnum = pgEnum('plan_type', ['free', 'pro', 'enterprise']);

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'supervisor', 'employee']);

// Task types
export const taskTypeEnum = pgEnum('task_type', ['scheduled', 'corrective', 'preventive']);

// Task priority levels
export const taskPriorityEnum = pgEnum('task_priority', ['critical', 'high', 'medium', 'low']);

// Task status
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);

// Checklist item status
export const checklistStatusEnum = pgEnum('checklist_status', ['pending', 'ok', 'problem']);

// Task completion status
export const completionStatusEnum = pgEnum('completion_status', ['ok', 'problem']);

// Problem reason categories
export const problemReasonEnum = pgEnum('problem_reason', [
  'no_time',
  'no_supplies',
  'equipment_broken',
  'other',
]);

// Problem status
export const problemStatusEnum = pgEnum('problem_status', ['open', 'assigned', 'resolved']);

// Notification types
export const notificationTypeEnum = pgEnum('notification_type', [
  'task_assigned',
  'task_reminder',
  'task_overdue',
  'problem_reported',
]);
