/**
 * Recurrence rule processing (T091)
 * Handles task recurrence logic for scheduled tasks
 */

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  endDate?: string; // ISO date when recurrence ends
  maxOccurrences?: number; // Maximum number of occurrences
  timezone?: string; // IANA timezone
}

export interface GeneratedTask {
  title: string;
  description: string | null;
  type: 'scheduled' | 'corrective' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  areaId: string;
  assignedToId: string | null;
  dueDate: Date;
  scheduledTime: string | null;
  hasChecklist: boolean;
  sourceTaskId: string; // Reference to original task template
  recurrenceIndex: number; // Which occurrence this is
}

/**
 * Calculate the next occurrence date based on recurrence rule
 */
export function getNextOccurrence(
  lastDate: Date,
  rule: RecurrenceRule
): Date | null {
  const next = new Date(lastDate);

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find next matching day of week
        const currentDayOfWeek = next.getDay();
        const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);

        // Find next day in same week
        const nextDayInWeek = sortedDays.find((d) => d > currentDayOfWeek);
        if (nextDayInWeek !== undefined) {
          next.setDate(next.getDate() + (nextDayInWeek - currentDayOfWeek));
        } else {
          // Move to first day of next interval week
          const daysUntilNextWeek = 7 - currentDayOfWeek + sortedDays[0];
          next.setDate(next.getDate() + daysUntilNextWeek + (rule.interval - 1) * 7);
        }
      } else {
        next.setDate(next.getDate() + 7 * rule.interval);
      }
      break;

    case 'monthly':
      if (rule.dayOfMonth) {
        // Move to next month, set specific day
        next.setMonth(next.getMonth() + rule.interval);
        // Handle months with fewer days
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(rule.dayOfMonth, daysInMonth));
      } else {
        // Same day of month, next month
        const targetDay = next.getDate();
        next.setMonth(next.getMonth() + rule.interval);
        // Handle overflow (e.g., Jan 31 -> Feb 28)
        if (next.getDate() !== targetDay) {
          next.setDate(0); // Go to last day of previous month
        }
      }
      break;
  }

  // Check if we've passed the end date
  if (rule.endDate) {
    const endDate = new Date(rule.endDate);
    if (next > endDate) {
      return null;
    }
  }

  return next;
}

/**
 * Generate upcoming tasks from a template with recurrence rule
 * @param template The source task template
 * @param rule The recurrence rule
 * @param fromDate Start generating from this date
 * @param days Number of days ahead to generate
 * @param existingCount Number of already generated occurrences
 */
export function generateRecurringTasks(
  template: {
    id: string;
    title: string;
    description: string | null;
    type: 'scheduled' | 'corrective' | 'preventive';
    priority: 'low' | 'medium' | 'high' | 'critical';
    areaId: string;
    assignedToId: string | null;
    scheduledTime: string | null;
    hasChecklist: boolean;
    dueDate: Date | null;
  },
  rule: RecurrenceRule,
  fromDate: Date,
  days: number,
  existingCount: number = 0
): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const endDate = new Date(fromDate);
  endDate.setDate(endDate.getDate() + days);

  // Start from template due date or fromDate
  let currentDate = template.dueDate ? new Date(template.dueDate) : new Date(fromDate);

  // Move to first occurrence on or after fromDate
  while (currentDate < fromDate) {
    const next = getNextOccurrence(currentDate, rule);
    if (!next) break;
    currentDate = next;
  }

  let occurrenceIndex = existingCount;

  // Generate tasks until we exceed the end date or max occurrences
  while (currentDate <= endDate) {
    // Check max occurrences
    if (rule.maxOccurrences && occurrenceIndex >= rule.maxOccurrences) {
      break;
    }

    // Only generate if within the date range
    if (currentDate >= fromDate) {
      tasks.push({
        title: template.title,
        description: template.description,
        type: template.type,
        priority: template.priority,
        areaId: template.areaId,
        assignedToId: template.assignedToId,
        dueDate: new Date(currentDate),
        scheduledTime: template.scheduledTime,
        hasChecklist: template.hasChecklist,
        sourceTaskId: template.id,
        recurrenceIndex: occurrenceIndex,
      });
    }

    occurrenceIndex++;

    // Get next occurrence
    const next = getNextOccurrence(currentDate, rule);
    if (!next) break;
    currentDate = next;
  }

  return tasks;
}

/**
 * Parse recurrence rule from task settings
 */
export function parseRecurrenceRule(settings: unknown): RecurrenceRule | null {
  if (!settings || typeof settings !== 'object') {
    return null;
  }

  const s = settings as Record<string, unknown>;

  if (!s.frequency || !['daily', 'weekly', 'monthly'].includes(s.frequency as string)) {
    return null;
  }

  return {
    frequency: s.frequency as RecurrenceRule['frequency'],
    interval: typeof s.interval === 'number' ? s.interval : 1,
    daysOfWeek: Array.isArray(s.daysOfWeek) ? s.daysOfWeek.filter((d) => typeof d === 'number') : undefined,
    dayOfMonth: typeof s.dayOfMonth === 'number' ? s.dayOfMonth : undefined,
    endDate: typeof s.endDate === 'string' ? s.endDate : undefined,
    maxOccurrences: typeof s.maxOccurrences === 'number' ? s.maxOccurrences : undefined,
    timezone: typeof s.timezone === 'string' ? s.timezone : 'America/Argentina/Buenos_Aires',
  };
}

/**
 * Get human-readable description of recurrence rule
 */
export function describeRecurrence(rule: RecurrenceRule): string {
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  switch (rule.frequency) {
    case 'daily':
      if (rule.interval === 1) return 'Diariamente';
      return `Cada ${rule.interval} días`;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const days = rule.daysOfWeek.map((d) => dayNames[d]).join(', ');
        if (rule.interval === 1) return `Cada semana: ${days}`;
        return `Cada ${rule.interval} semanas: ${days}`;
      }
      if (rule.interval === 1) return 'Semanalmente';
      return `Cada ${rule.interval} semanas`;

    case 'monthly':
      if (rule.dayOfMonth) {
        if (rule.interval === 1) return `Mensualmente el día ${rule.dayOfMonth}`;
        return `Cada ${rule.interval} meses el día ${rule.dayOfMonth}`;
      }
      if (rule.interval === 1) return 'Mensualmente';
      return `Cada ${rule.interval} meses`;

    default:
      return 'Recurrente';
  }
}
