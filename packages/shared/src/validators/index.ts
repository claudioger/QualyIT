import { z } from 'zod';

// ===========================================
// QualyIT Validators (Zod Schemas)
// ===========================================

// Enum validators - must match database enums exactly
export const planTypeSchema = z.enum(['free', 'pro', 'enterprise']);
export const userRoleSchema = z.enum(['admin', 'manager', 'supervisor', 'employee']);
export const taskTypeSchema = z.enum(['scheduled', 'corrective', 'preventive']);
export const taskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export const checklistStatusSchema = z.enum(['pending', 'ok', 'problem']);
export const completionStatusSchema = z.enum(['ok', 'problem']);
export const problemReasonSchema = z.enum(['no_time', 'no_supplies', 'equipment_broken', 'other']);
export const problemStatusSchema = z.enum(['open', 'assigned', 'resolved']);
export const notificationTypeSchema = z.enum([
  'task_assigned',
  'task_reminder',
  'task_overdue',
  'problem_reported',
]);

// Settings validators
export const tenantSettingsSchema = z.object({
  timezone: z.string().optional(),
  locale: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
});

export const notificationPreferencesSchema = z.object({
  taskAssigned: z.boolean().optional(),
  taskReminder: z.boolean().optional(),
  taskOverdue: z.boolean().optional(),
  problemReported: z.boolean().optional(),
  channels: z
    .object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
    })
    .optional(),
});

export const areaSettingsSchema = z.object({
  defaultTaskPriority: taskPrioritySchema.optional(),
  requirePhotoOnProblem: z.boolean().optional(),
});

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  interval: z.number().int().positive(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string(),
});

// Entity validators
export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/),
  plan: planTypeSchema.optional(),
  settings: tenantSettingsSchema.optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: tenantSettingsSchema.optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  role: userRoleSchema.optional(),
  temporaryPassword: z.string().min(8).max(72),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: userRoleSchema.optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const createAreaSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
  responsibleId: z.string().uuid().optional(),
  backupResponsibleId: z.string().uuid().optional(),
  settings: areaSettingsSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const updateAreaSchema = createAreaSchema.partial();

export const checklistItemInputSchema = z.object({
  label: z.string().min(1).max(500),
  isRequired: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  areaId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: taskTypeSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  recurrenceRule: z.string().optional(),
  checklistItems: z.array(checklistItemInputSchema).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const completeTaskSchema = z.object({
  status: completionStatusSchema,
  notes: z.string().optional(),
  offlineId: z.string().optional(),
});

export const completeChecklistItemSchema = z.object({
  status: checklistStatusSchema,
  problemReason: z.string().max(255).optional(),
  offlineId: z.string().optional(),
});

export const reportProblemSchema = z.object({
  reasonCategory: problemReasonSchema,
  description: z.string().optional(),
});

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
});

// Query validators
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  areaId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  type: taskTypeSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
});
