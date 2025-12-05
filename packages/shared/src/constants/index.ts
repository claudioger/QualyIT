// ===========================================
// QualyIT Constants
// ===========================================

// User roles with Spanish labels
export const USER_ROLES = {
  admin: { value: 'admin', label: 'Administrador', order: 1 },
  manager: { value: 'manager', label: 'Gerente', order: 2 },
  supervisor: { value: 'supervisor', label: 'Supervisor', order: 3 },
  employee: { value: 'employee', label: 'Empleado', order: 4 },
} as const;

// Task types with Spanish labels
export const TASK_TYPES = {
  scheduled: { value: 'scheduled', label: 'Programada', icon: 'Calendar' },
  corrective: { value: 'corrective', label: 'Correctiva', icon: 'Wrench' },
  preventive: { value: 'preventive', label: 'Preventiva', icon: 'Shield' },
} as const;

// Task priorities with Spanish labels and colors
export const TASK_PRIORITIES = {
  critical: { value: 'critical', label: 'Crítica', color: 'red', order: 1 },
  high: { value: 'high', label: 'Alta', color: 'orange', order: 2 },
  medium: { value: 'medium', label: 'Media', color: 'yellow', order: 3 },
  low: { value: 'low', label: 'Baja', color: 'green', order: 4 },
} as const;

// Task statuses with Spanish labels
export const TASK_STATUSES = {
  pending: { value: 'pending', label: 'Pendiente', color: 'gray' },
  in_progress: { value: 'in_progress', label: 'En Progreso', color: 'blue' },
  completed: { value: 'completed', label: 'Completada', color: 'green' },
  cancelled: { value: 'cancelled', label: 'Cancelada', color: 'red' },
} as const;

// Checklist item statuses with Spanish labels
export const CHECKLIST_STATUSES = {
  pending: { value: 'pending', label: 'Pendiente', color: 'gray' },
  ok: { value: 'ok', label: 'OK', color: 'green' },
  problem: { value: 'problem', label: 'Problema', color: 'red' },
} as const;

// Problem reasons with Spanish labels
export const PROBLEM_REASONS = {
  no_time: { value: 'no_time', label: 'Sin tiempo' },
  no_supplies: { value: 'no_supplies', label: 'Sin insumos' },
  equipment_broken: { value: 'equipment_broken', label: 'Equipo dañado' },
  other: { value: 'other', label: 'Otro' },
} as const;

// Problem statuses with Spanish labels
export const PROBLEM_STATUSES = {
  open: { value: 'open', label: 'Abierto', color: 'red' },
  assigned: { value: 'assigned', label: 'Asignado', color: 'yellow' },
  resolved: { value: 'resolved', label: 'Resuelto', color: 'green' },
} as const;

// Notification types with Spanish labels
export const NOTIFICATION_TYPES = {
  task_assigned: { value: 'task_assigned', label: 'Tarea Asignada' },
  task_reminder: { value: 'task_reminder', label: 'Recordatorio de Tarea' },
  task_overdue: { value: 'task_overdue', label: 'Tarea Vencida' },
  problem_reported: { value: 'problem_reported', label: 'Problema Reportado' },
} as const;

// Plan types with Spanish labels
export const PLAN_TYPES = {
  free: { value: 'free', label: 'Gratuito', maxUsers: 5, maxAreas: 3 },
  pro: { value: 'pro', label: 'Profesional', maxUsers: 50, maxAreas: 20 },
  enterprise: { value: 'enterprise', label: 'Empresa', maxUsers: -1, maxAreas: -1 },
} as const;

// Recurrence frequencies with Spanish labels
export const RECURRENCE_FREQUENCIES = {
  daily: { value: 'daily', label: 'Diaria' },
  weekly: { value: 'weekly', label: 'Semanal' },
  monthly: { value: 'monthly', label: 'Mensual' },
} as const;

// Days of week with Spanish labels
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
] as const;

// App configuration
export const APP_CONFIG = {
  name: 'QualyIT',
  defaultLocale: 'es-AR',
  defaultTimezone: 'America/Argentina/Buenos_Aires',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxTasksPerDay: 100,
  offlineSyncInterval: 30000, // 30 seconds
  dashboardRefreshInterval: 30000, // 30 seconds
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: [
    'tenant:read',
    'areas:*',
    'users:*',
    'tasks:*',
    'dashboard:read',
    'reports:read',
  ],
  supervisor: [
    'areas:read',
    'areas:update',
    'users:read',
    'tasks:*',
    'dashboard:read',
  ],
  employee: [
    'tasks:read',
    'tasks:complete',
    'problems:create',
  ],
} as const;
