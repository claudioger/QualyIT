// ===========================================
// QualyIT Shared Types
// ===========================================

// Enum types
export type PlanType = 'free' | 'pro' | 'enterprise';
export type UserRole = 'admin' | 'manager' | 'supervisor' | 'employee';
export type TaskType = 'scheduled' | 'corrective' | 'preventive';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ChecklistStatus = 'pending' | 'ok' | 'problem';
export type CompletionStatus = 'ok' | 'problem';
export type ProblemReason = 'no_time' | 'no_supplies' | 'equipment_broken' | 'other';
export type ProblemStatus = 'open' | 'assigned' | 'resolved';
export type NotificationType = 'task_assigned' | 'task_reminder' | 'task_overdue' | 'problem_reported';

// Settings interfaces
export interface TenantSettings {
  timezone?: string;
  locale?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface NotificationPreferences {
  taskAssigned?: boolean;
  taskReminder?: boolean;
  taskOverdue?: boolean;
  problemReported?: boolean;
  channels?: {
    push?: boolean;
    email?: boolean;
  };
}

export interface AreaSettings {
  defaultTaskPriority?: TaskPriority;
  requirePhotoOnProblem?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
  timezone: string;
}

export interface NotificationData {
  taskId?: string;
  areaId?: string;
  problemId?: string;
  deepLink?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth types
export interface AuthUser {
  id: string;
  tenantId: string;
  clerkUserId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

// Task completion offline types
export interface OfflineCompletion {
  id: string;
  taskId: string;
  checklistItemId?: string;
  status: CompletionStatus;
  notes?: string;
  timestamp: number;
  synced: boolean;
}

export interface OfflineFile {
  id: string;
  completionId: string;
  blob: Blob;
  filename: string;
  contentType: string;
  synced: boolean;
}
