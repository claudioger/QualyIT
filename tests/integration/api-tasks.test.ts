import { describe, it, expect, vi, beforeAll } from 'vitest';

// Simple mock implementation without external dependencies
// This tests the API contract and response format

interface MockTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  area: { id: string; name: string };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// Mock data
const mockTasks: MockTask[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    title: 'Limpiar cocina',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    area: { id: '00000000-0000-0000-0000-000000000003', name: 'Cocina' },
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    title: 'Revisar equipos',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date().toISOString(),
    area: { id: '00000000-0000-0000-0000-000000000003', name: 'Cocina' },
  },
];

// Mock API handlers
const mockApi = {
  getTodayTasks: (): ApiResponse<MockTask[]> => ({
    success: true,
    data: mockTasks.filter((t) => t.status !== 'completed'),
  }),

  getTasks: (params: { page?: number; pageSize?: number; status?: string }): ApiResponse<{
    items: MockTask[];
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> => {
    const { page = 1, pageSize = 20, status } = params;
    let filtered = [...mockTasks];
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    return {
      success: true,
      data: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        hasMore: filtered.length > page * pageSize,
      },
    };
  },

  getTask: (id: string): ApiResponse<MockTask> => {
    const task = mockTasks.find((t) => t.id === id);
    if (!task) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
    }
    return { success: true, data: task };
  },

  createTask: (body: { areaId: string; title: string; priority?: string }): ApiResponse<MockTask> => {
    if (!body.areaId || !body.title) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } };
    }
    if (body.title.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title cannot be empty' } };
    }
    const newTask: MockTask = {
      id: '00000000-0000-0000-0000-000000000200',
      title: body.title,
      status: 'pending',
      priority: body.priority || 'medium',
      dueDate: new Date().toISOString(),
      area: { id: body.areaId, name: 'Test Area' },
    };
    return { success: true, data: newTask };
  },

  completeTask: (id: string, body: { status: 'ok' | 'problem'; notes?: string }): ApiResponse<MockTask & { completionStatus: string }> => {
    const task = mockTasks.find((t) => t.id === id);
    if (!task) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
    }
    if (!['ok', 'problem'].includes(body.status)) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } };
    }
    return {
      success: true,
      data: {
        ...task,
        status: 'completed',
        completionStatus: body.status,
      },
    };
  },

  reassignTask: (id: string, body: { assignedToId?: string }): ApiResponse<MockTask> => {
    const task = mockTasks.find((t) => t.id === id);
    if (!task) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };
    }
    if (!body.assignedToId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'assignedToId required' } };
    }
    return { success: true, data: { ...task } };
  },
};

describe('Tasks API Contract', () => {
  describe('GET /tasks/today', () => {
    it('should return today\'s tasks', () => {
      const result = mockApi.getTodayTasks();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should only return non-completed tasks', () => {
      const result = mockApi.getTodayTasks();
      result.data?.forEach((task) => {
        expect(task.status).not.toBe('completed');
      });
    });
  });

  describe('GET /tasks', () => {
    it('should return paginated tasks', () => {
      const result = mockApi.getTasks({ page: 1, pageSize: 10 });
      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(10);
    });

    it('should filter by status', () => {
      const result = mockApi.getTasks({ status: 'pending' });
      expect(result.success).toBe(true);
      result.data?.items.forEach((task) => {
        expect(task.status).toBe('pending');
      });
    });

    it('should use default pagination', () => {
      const result = mockApi.getTasks({});
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(20);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task', () => {
      const result = mockApi.getTask('00000000-0000-0000-0000-000000000101');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('00000000-0000-0000-0000-000000000101');
      expect(result.data?.title).toBe('Limpiar cocina');
    });

    it('should return error for non-existent task', () => {
      const result = mockApi.getTask('00000000-0000-0000-0000-000000000999');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', () => {
      const result = mockApi.createTask({
        areaId: '00000000-0000-0000-0000-000000000003',
        title: 'Nueva tarea de test',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Nueva tarea de test');
      expect(result.data?.priority).toBe('high');
      expect(result.data?.status).toBe('pending');
    });

    it('should use default values', () => {
      const result = mockApi.createTask({
        areaId: '00000000-0000-0000-0000-000000000003',
        title: 'Tarea con defaults',
      });
      expect(result.data?.priority).toBe('medium');
    });

    it('should reject invalid data', () => {
      const result = mockApi.createTask({
        areaId: '',
        title: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('POST /tasks/:id/complete', () => {
    it('should complete a task with OK status', () => {
      const result = mockApi.completeTask('00000000-0000-0000-0000-000000000101', {
        status: 'ok',
        notes: 'Completado sin problemas',
      });
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.completionStatus).toBe('ok');
    });

    it('should complete a task with problem status', () => {
      const result = mockApi.completeTask('00000000-0000-0000-0000-000000000101', {
        status: 'problem',
        notes: 'Falta suministros',
      });
      expect(result.data?.completionStatus).toBe('problem');
    });

    it('should return error for non-existent task', () => {
      const result = mockApi.completeTask('00000000-0000-0000-0000-000000000999', {
        status: 'ok',
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /tasks/:id/reassign', () => {
    it('should reassign a task', () => {
      const result = mockApi.reassignTask('00000000-0000-0000-0000-000000000101', {
        assignedToId: '00000000-0000-0000-0000-000000000005',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing assignedToId', () => {
      const result = mockApi.reassignTask('00000000-0000-0000-0000-000000000101', {});
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });
});

describe('API Response Format', () => {
  it('should return success: true on success', () => {
    const result = mockApi.getTodayTasks();
    expect(result.success).toBe(true);
  });

  it('should return success: false on error', () => {
    const result = mockApi.getTask('00000000-0000-0000-0000-000000000999');
    expect(result.success).toBe(false);
  });

  it('should include error details on failure', () => {
    const result = mockApi.getTask('00000000-0000-0000-0000-000000000999');
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBeDefined();
    expect(result.error?.message).toBeDefined();
  });
});

describe('Task Data Validation', () => {
  it('should validate task has required fields', () => {
    const result = mockApi.getTodayTasks();
    result.data?.forEach((task) => {
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.status).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(task.area).toBeDefined();
    });
  });

  it('should have valid status values', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const result = mockApi.getTodayTasks();
    result.data?.forEach((task) => {
      expect(validStatuses).toContain(task.status);
    });
  });

  it('should have valid priority values', () => {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    const result = mockApi.getTodayTasks();
    result.data?.forEach((task) => {
      expect(validPriorities).toContain(task.priority);
    });
  });

  it('should have valid UUID format for IDs', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const result = mockApi.getTodayTasks();
    result.data?.forEach((task) => {
      expect(task.id).toMatch(uuidRegex);
      expect(task.area.id).toMatch(uuidRegex);
    });
  });
});
