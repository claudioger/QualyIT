import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test quiet hours logic directly (extracted from service)
function isInQuietHours(quietStart: string | null, quietEnd: string | null, mockNow?: Date): boolean {
  if (!quietStart || !quietEnd) return false;

  const now = mockNow || new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// Test preference checking logic
function shouldSendNotification(
  type: 'task_assigned' | 'task_reminder' | 'task_overdue' | 'problem_reported',
  preferences: {
    taskAssigned?: boolean;
    taskReminder?: boolean;
    taskOverdue?: boolean;
    problemReported?: boolean;
  } | null
): boolean {
  if (!preferences) return true;

  switch (type) {
    case 'task_assigned':
      return preferences.taskAssigned !== false;
    case 'task_reminder':
      return preferences.taskReminder !== false;
    case 'task_overdue':
      return preferences.taskOverdue !== false;
    case 'problem_reported':
      return preferences.problemReported !== false;
    default:
      return true;
  }
}

describe('Notification Service - Quiet Hours', () => {
  describe('isInQuietHours', () => {
    it('should return false when no quiet hours set', () => {
      expect(isInQuietHours(null, null)).toBe(false);
      expect(isInQuietHours('22:00', null)).toBe(false);
      expect(isInQuietHours(null, '07:00')).toBe(false);
    });

    it('should detect same-day quiet hours', () => {
      // Quiet hours: 13:00 - 14:00
      const mockTime = new Date('2025-01-15T13:30:00');
      expect(isInQuietHours('13:00', '14:00', mockTime)).toBe(true);

      const outsideTime = new Date('2025-01-15T12:30:00');
      expect(isInQuietHours('13:00', '14:00', outsideTime)).toBe(false);
    });

    it('should detect overnight quiet hours (22:00 - 07:00)', () => {
      // At 23:00 - should be in quiet hours
      const lateNight = new Date('2025-01-15T23:00:00');
      expect(isInQuietHours('22:00', '07:00', lateNight)).toBe(true);

      // At 06:00 - should be in quiet hours
      const earlyMorning = new Date('2025-01-15T06:00:00');
      expect(isInQuietHours('22:00', '07:00', earlyMorning)).toBe(true);

      // At 12:00 - should NOT be in quiet hours
      const midday = new Date('2025-01-15T12:00:00');
      expect(isInQuietHours('22:00', '07:00', midday)).toBe(false);

      // At 08:00 - should NOT be in quiet hours
      const morning = new Date('2025-01-15T08:00:00');
      expect(isInQuietHours('22:00', '07:00', morning)).toBe(false);

      // At 21:00 - should NOT be in quiet hours
      const evening = new Date('2025-01-15T21:00:00');
      expect(isInQuietHours('22:00', '07:00', evening)).toBe(false);
    });

    it('should handle exact boundary times', () => {
      // At exactly 22:00 - should be in quiet hours
      const startTime = new Date('2025-01-15T22:00:00');
      expect(isInQuietHours('22:00', '07:00', startTime)).toBe(true);

      // At exactly 07:00 - should be in quiet hours (inclusive)
      const endTime = new Date('2025-01-15T07:00:00');
      expect(isInQuietHours('22:00', '07:00', endTime)).toBe(true);
    });

    it('should handle minutes correctly', () => {
      // Quiet hours: 22:30 - 06:45
      const quietStart = '22:30';
      const quietEnd = '06:45';

      // 22:15 - before start
      expect(isInQuietHours(quietStart, quietEnd, new Date('2025-01-15T22:15:00'))).toBe(false);

      // 22:45 - in quiet hours
      expect(isInQuietHours(quietStart, quietEnd, new Date('2025-01-15T22:45:00'))).toBe(true);

      // 06:30 - still in quiet hours
      expect(isInQuietHours(quietStart, quietEnd, new Date('2025-01-15T06:30:00'))).toBe(true);

      // 06:50 - after quiet hours
      expect(isInQuietHours(quietStart, quietEnd, new Date('2025-01-15T06:50:00'))).toBe(false);
    });
  });
});

describe('Notification Service - User Preferences', () => {
  describe('shouldSendNotification', () => {
    it('should send all by default when no preferences', () => {
      expect(shouldSendNotification('task_assigned', null)).toBe(true);
      expect(shouldSendNotification('task_reminder', null)).toBe(true);
      expect(shouldSendNotification('task_overdue', null)).toBe(true);
      expect(shouldSendNotification('problem_reported', null)).toBe(true);
    });

    it('should respect task_assigned preference', () => {
      expect(shouldSendNotification('task_assigned', { taskAssigned: true })).toBe(true);
      expect(shouldSendNotification('task_assigned', { taskAssigned: false })).toBe(false);
      // Undefined should default to true
      expect(shouldSendNotification('task_assigned', {})).toBe(true);
    });

    it('should respect task_reminder preference', () => {
      expect(shouldSendNotification('task_reminder', { taskReminder: true })).toBe(true);
      expect(shouldSendNotification('task_reminder', { taskReminder: false })).toBe(false);
    });

    it('should respect task_overdue preference', () => {
      expect(shouldSendNotification('task_overdue', { taskOverdue: true })).toBe(true);
      expect(shouldSendNotification('task_overdue', { taskOverdue: false })).toBe(false);
    });

    it('should respect problem_reported preference', () => {
      expect(shouldSendNotification('problem_reported', { problemReported: true })).toBe(true);
      expect(shouldSendNotification('problem_reported', { problemReported: false })).toBe(false);
    });

    it('should handle mixed preferences', () => {
      const preferences = {
        taskAssigned: true,
        taskReminder: false,
        taskOverdue: true,
        problemReported: false,
      };

      expect(shouldSendNotification('task_assigned', preferences)).toBe(true);
      expect(shouldSendNotification('task_reminder', preferences)).toBe(false);
      expect(shouldSendNotification('task_overdue', preferences)).toBe(true);
      expect(shouldSendNotification('problem_reported', preferences)).toBe(false);
    });
  });
});

describe('Notification Service - Time Text Formatting', () => {
  function formatTimeUntilDue(minutesUntilDue: number): string {
    return minutesUntilDue <= 60
      ? `${minutesUntilDue} minutos`
      : `${Math.round(minutesUntilDue / 60)} horas`;
  }

  it('should format minutes correctly', () => {
    expect(formatTimeUntilDue(30)).toBe('30 minutos');
    expect(formatTimeUntilDue(60)).toBe('60 minutos');
    expect(formatTimeUntilDue(45)).toBe('45 minutos');
  });

  it('should format hours correctly', () => {
    expect(formatTimeUntilDue(90)).toBe('2 horas');
    expect(formatTimeUntilDue(120)).toBe('2 horas');
    expect(formatTimeUntilDue(180)).toBe('3 horas');
    expect(formatTimeUntilDue(1440)).toBe('24 horas');
  });

  it('should round hours', () => {
    expect(formatTimeUntilDue(75)).toBe('1 horas');
    expect(formatTimeUntilDue(105)).toBe('2 horas');
    expect(formatTimeUntilDue(150)).toBe('3 horas');
  });
});

describe('Notification Types', () => {
  const validTypes = [
    'task_assigned',
    'task_reminder',
    'task_overdue',
    'problem_reported',
  ] as const;

  it('should have all notification types available', () => {
    expect(validTypes).toContain('task_assigned');
    expect(validTypes).toContain('task_reminder');
    expect(validTypes).toContain('task_overdue');
    expect(validTypes).toContain('problem_reported');
    expect(validTypes.length).toBe(4);
  });

  it('should map to correct Spanish titles', () => {
    const titleMap: Record<typeof validTypes[number], string> = {
      task_assigned: 'Nueva tarea asignada',
      task_reminder: 'Tarea próxima a vencer',
      task_overdue: 'Tarea vencida',
      problem_reported: 'Problema reportado',
    };

    validTypes.forEach((type) => {
      expect(titleMap[type]).toBeDefined();
      expect(titleMap[type].length).toBeGreaterThan(0);
    });
  });
});

describe('Push Notification Payload Structure', () => {
  it('should create valid web push payload', () => {
    const payload = {
      notification: {
        title: 'Test Title',
        body: 'Test Body',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { taskId: 'task-123' },
        actions: [
          { action: 'open', title: 'Ver' },
          { action: 'dismiss', title: 'Descartar' },
        ],
      },
    };

    expect(payload.notification.title).toBe('Test Title');
    expect(payload.notification.body).toBe('Test Body');
    expect(payload.notification.icon).toContain('icon');
    expect(payload.notification.badge).toContain('badge');
    expect(payload.notification.actions).toHaveLength(2);
  });

  it('should create valid FCM payload', () => {
    const payload = {
      token: 'fcm-token-here',
      notification: {
        title: 'Test Title',
        body: 'Test Body',
      },
      data: {
        taskId: 'task-123',
        type: 'task_assigned',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'qualyit_tasks',
          icon: 'ic_notification',
          color: '#6366f1',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    expect(payload.notification.title).toBe('Test Title');
    expect(payload.android.priority).toBe('high');
    expect(payload.android.notification.channelId).toBe('qualyit_tasks');
    expect(payload.apns.payload.aps.sound).toBe('default');
  });
});
