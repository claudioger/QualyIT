import { describe, it, expect } from 'vitest';
import {
  createTenantSchema,
  createUserSchema,
  createAreaSchema,
  createTaskSchema,
  completeTaskSchema,
  completeChecklistItemSchema,
  reportProblemSchema,
  presignUploadSchema,
  paginationSchema,
  taskFiltersSchema,
  recurrenceRuleSchema,
  changePasswordSchema,
  updateUserSchema,
  notificationPreferencesSchema,
} from '@qualyit/shared/validators';

describe('Validators - Tenant', () => {
  describe('createTenantSchema', () => {
    it('should validate valid tenant data', () => {
      const validData = {
        name: 'Hotel Termas',
        subdomain: 'termas',
        plan: 'pro',
      };
      const result = createTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        subdomain: 'termas',
      };
      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid subdomain format', () => {
      const invalidData = {
        name: 'Hotel Test',
        subdomain: 'INVALID_SUBDOMAIN!',
      };
      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain less than 3 characters', () => {
      const invalidData = {
        name: 'Hotel Test',
        subdomain: 'ab',
      };
      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid subdomain with hyphens', () => {
      const validData = {
        name: 'Hotel Test',
        subdomain: 'hotel-termas-123',
      };
      const result = createTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan type', () => {
      const invalidData = {
        name: 'Hotel Test',
        subdomain: 'test',
        plan: 'invalid',
      };
      const result = createTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validators - User', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        email: 'user@example.com',
        name: 'Juan Pérez',
        role: 'employee',
        temporaryPassword: 'SecurePass123!',
      };
      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Juan Pérez',
        temporaryPassword: 'SecurePass123!',
      };
      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password less than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        name: 'Juan Pérez',
        temporaryPassword: 'short',
      };
      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid roles', () => {
      const roles = ['admin', 'manager', 'supervisor', 'employee'];
      roles.forEach((role) => {
        const result = createUserSchema.safeParse({
          email: 'user@example.com',
          name: 'Test User',
          role,
          temporaryPassword: 'SecurePass123!',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'user@example.com',
        name: 'Test User',
        role: 'superadmin',
        temporaryPassword: 'SecurePass123!',
      };
      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid password change', () => {
      const validData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      };
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'NewPassword456!',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject new password less than 8 chars', () => {
      const invalidData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'short',
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial update', () => {
      const validData = {
        name: 'Nuevo Nombre',
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate quiet hours', () => {
      const validData = {
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      };
      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Validators - Area', () => {
  describe('createAreaSchema', () => {
    it('should validate valid area data', () => {
      const validData = {
        name: 'Cocina Principal',
        code: 'COC-01',
      };
      const result = createAreaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };
      const result = createAreaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate with parent ID', () => {
      const validData = {
        name: 'Sub área',
        parentId: '00000000-0000-0000-0000-000000000001',
      };
      const result = createAreaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for parentId', () => {
      const invalidData = {
        name: 'Sub área',
        parentId: 'invalid-uuid',
      };
      const result = createAreaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate with settings', () => {
      const validData = {
        name: 'Cocina',
        settings: {
          defaultTaskPriority: 'high',
          requirePhotoOnProblem: true,
        },
      };
      const result = createAreaSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Validators - Task', () => {
  describe('createTaskSchema', () => {
    it('should validate valid task data', () => {
      const validData = {
        areaId: '00000000-0000-0000-0000-000000000001',
        title: 'Limpiar pisos',
        type: 'scheduled',
        priority: 'medium',
      };
      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing areaId', () => {
      const invalidData = {
        title: 'Limpiar pisos',
      };
      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidData = {
        areaId: '00000000-0000-0000-0000-000000000001',
        title: '',
      };
      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate all task types', () => {
      const types = ['scheduled', 'corrective', 'preventive'];
      types.forEach((type) => {
        const result = createTaskSchema.safeParse({
          areaId: '00000000-0000-0000-0000-000000000001',
          title: 'Test Task',
          type,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate all priorities', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];
      priorities.forEach((priority) => {
        const result = createTaskSchema.safeParse({
          areaId: '00000000-0000-0000-0000-000000000001',
          title: 'Test Task',
          priority,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate with checklist items', () => {
      const validData = {
        areaId: '00000000-0000-0000-0000-000000000001',
        title: 'Checklist Task',
        checklistItems: [
          { label: 'Item 1', isRequired: true },
          { label: 'Item 2', isRequired: false },
        ],
      };
      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('completeTaskSchema', () => {
    it('should validate OK completion', () => {
      const validData = {
        status: 'ok',
        notes: 'Completado sin problemas',
      };
      const result = completeTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate problem completion', () => {
      const validData = {
        status: 'problem',
        notes: 'No había suministros',
      };
      const result = completeTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid',
      };
      const result = completeTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate with offline ID', () => {
      const validData = {
        status: 'ok',
        offlineId: 'offline-123',
      };
      const result = completeTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('completeChecklistItemSchema', () => {
    it('should validate all checklist statuses', () => {
      const statuses = ['pending', 'ok', 'problem'];
      statuses.forEach((status) => {
        const result = completeChecklistItemSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should validate with problem reason', () => {
      const validData = {
        status: 'problem',
        problemReason: 'Equipo dañado',
      };
      const result = completeChecklistItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Validators - Problem', () => {
  describe('reportProblemSchema', () => {
    it('should validate all reason categories', () => {
      const categories = ['no_time', 'no_supplies', 'equipment_broken', 'other'];
      categories.forEach((reasonCategory) => {
        const result = reportProblemSchema.safeParse({ reasonCategory });
        expect(result.success).toBe(true);
      });
    });

    it('should validate with description', () => {
      const validData = {
        reasonCategory: 'equipment_broken',
        description: 'La aspiradora no funciona',
      };
      const result = reportProblemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid reason category', () => {
      const invalidData = {
        reasonCategory: 'invalid',
      };
      const result = reportProblemSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validators - Upload', () => {
  describe('presignUploadSchema', () => {
    it('should validate valid upload request', () => {
      const validData = {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1024 * 1024, // 1MB
      };
      const result = presignUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject file over 10MB', () => {
      const invalidData = {
        filename: 'large.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 11 * 1024 * 1024, // 11MB
      };
      const result = presignUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty filename', () => {
      const invalidData = {
        filename: '',
        contentType: 'image/jpeg',
        sizeBytes: 1024,
      };
      const result = presignUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero size', () => {
      const invalidData = {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 0,
      };
      const result = presignUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validators - Pagination & Filters', () => {
  describe('paginationSchema', () => {
    it('should use defaults when empty', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should coerce string to number', () => {
      const result = paginationSchema.safeParse({ page: '2', pageSize: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it('should reject page size over 100', () => {
      const result = paginationSchema.safeParse({ pageSize: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject negative page', () => {
      const result = paginationSchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('taskFiltersSchema', () => {
    it('should validate all filter combinations', () => {
      const validData = {
        status: 'pending',
        areaId: '00000000-0000-0000-0000-000000000001',
        assignedToId: '00000000-0000-0000-0000-000000000002',
        type: 'scheduled',
        priority: 'high',
      };
      const result = taskFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial filters', () => {
      const validData = {
        status: 'completed',
      };
      const result = taskFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid',
      };
      const result = taskFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validators - Recurrence', () => {
  describe('recurrenceRuleSchema', () => {
    it('should validate daily recurrence', () => {
      const validData = {
        frequency: 'daily',
        interval: 1,
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate weekly recurrence with days', () => {
      const validData = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate monthly recurrence', () => {
      const validData = {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 15,
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid day of week', () => {
      const invalidData = {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [7], // Invalid: 0-6 only
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid day of month', () => {
      const invalidData = {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 32,
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero interval', () => {
      const invalidData = {
        frequency: 'daily',
        interval: 0,
        timezone: 'America/Argentina/Buenos_Aires',
      };
      const result = recurrenceRuleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validators - Notifications', () => {
  describe('notificationPreferencesSchema', () => {
    it('should validate full preferences', () => {
      const validData = {
        taskAssigned: true,
        taskReminder: true,
        taskOverdue: false,
        problemReported: true,
        channels: {
          push: true,
          email: false,
        },
      };
      const result = notificationPreferencesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial preferences', () => {
      const validData = {
        taskAssigned: false,
      };
      const result = notificationPreferencesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty preferences', () => {
      const result = notificationPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
