import { vi } from 'vitest';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/qualyit_test';
process.env.CLERK_SECRET_KEY = 'sk_test_mock_key';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.R2_ACCESS_KEY_ID = 'test-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
process.env.R2_ENDPOINT = 'https://test.r2.cloudflarestorage.com';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

// Global test utilities
export const mockTenantId = '00000000-0000-0000-0000-000000000001';
export const mockUserId = '00000000-0000-0000-0000-000000000002';
export const mockAreaId = '00000000-0000-0000-0000-000000000003';
export const mockTaskId = '00000000-0000-0000-0000-000000000004';

// Mock Clerk auth
vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({
    sub: 'user_test123',
    org_id: 'org_test123',
  }),
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: 'user_test123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User',
      }),
      createUser: vi.fn().mockResolvedValue({
        id: 'user_new123',
      }),
      updateUser: vi.fn().mockResolvedValue({}),
      deleteUser: vi.fn().mockResolvedValue({}),
    },
    organizations: {
      getOrganization: vi.fn().mockResolvedValue({
        id: 'org_test123',
        name: 'Test Organization',
      }),
    },
  },
}));

// Mock database for unit tests (integration tests use real DB)
export const createMockDb = () => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
});

// Test data factories
export const createTestTenant = (overrides = {}) => ({
  id: mockTenantId,
  name: 'Hotel Test',
  subdomain: 'test',
  clerkOrgId: 'org_test123',
  plan: 'pro' as const,
  settings: {},
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestUser = (overrides = {}) => ({
  id: mockUserId,
  tenantId: mockTenantId,
  clerkUserId: 'user_test123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'employee' as const,
  notificationPreferences: {},
  isActive: true,
  mustChangePassword: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestArea = (overrides = {}) => ({
  id: mockAreaId,
  tenantId: mockTenantId,
  name: 'Cocina',
  code: 'COC',
  parentId: null,
  responsibleId: mockUserId,
  backupResponsibleId: null,
  settings: {},
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestTask = (overrides = {}) => ({
  id: mockTaskId,
  tenantId: mockTenantId,
  areaId: mockAreaId,
  createdById: mockUserId,
  assignedToId: mockUserId,
  templateId: null,
  title: 'Limpiar cocina',
  description: 'Limpieza general de cocina',
  type: 'scheduled' as const,
  priority: 'medium' as const,
  status: 'pending' as const,
  dueDate: new Date(),
  scheduledTime: null,
  completedAt: null,
  completedById: null,
  completionStatus: null,
  completionNotes: null,
  syncVersion: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
