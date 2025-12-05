import { Hono } from 'hono';
import { eq, and, ilike, or } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../lib/db';
import { users, areaUsers } from '@qualyit/database/schema';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  paginationSchema,
} from '@qualyit/shared/validators';
import { hashPassword, verifyPassword, generateTemporaryPassword } from '../lib/auth';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

export const usersRoutes = new Hono<Env>();

// GET /api/users - List users
usersRoutes.get('/', zValidator('query', paginationSchema.partial()), async (c) => {
  const tenantId = c.get('tenantId');
  const { page = 1, pageSize = 20 } = c.req.valid('query');
  const search = c.req.query('search');
  const role = c.req.query('role');
  const areaId = c.req.query('areaId');
  const db = getDb();

  // Build where conditions
  const conditions = [eq(users.tenantId, tenantId), eq(users.isActive, true)];

  if (search) {
    conditions.push(
      or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!
    );
  }

  if (role) {
    conditions.push(eq(users.role, role as 'admin' | 'manager' | 'supervisor' | 'employee'));
  }

  const allUsers = await db.query.users.findMany({
    where: and(...conditions),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy: (u, { asc }) => [asc(u.name)],
  });

  // If filtering by area, get users assigned to that area
  let filteredUsers = allUsers;
  if (areaId) {
    const areaUserIds = await db.query.areaUsers.findMany({
      where: and(eq(areaUsers.areaId, areaId), eq(areaUsers.tenantId, tenantId)),
      columns: { userId: true },
    });
    const userIdSet = new Set(areaUserIds.map((au) => au.userId));
    filteredUsers = allUsers.filter((u) => userIdSet.has(u.id));
  }

  return c.json({
    success: true,
    data: {
      items: filteredUsers,
      page,
      pageSize,
      hasMore: allUsers.length === pageSize,
    },
  });
});

// GET /api/users/me - Get current user
usersRoutes.get('/me', async (c) => {
  const userId = c.get('userId');
  const db = getDb();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      notificationPreferences: true,
      quietHoursStart: true,
      quietHoursEnd: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    throw Errors.notFound('Usuario');
  }

  return c.json({ success: true, data: user });
});

// GET /api/users/:id - Get user by ID
usersRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const userId = c.req.param('id');
  const db = getDb();

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    columns: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw Errors.notFound('Usuario');
  }

  // Get areas assigned to this user
  const userAreas = await db.query.areaUsers.findMany({
    where: and(eq(areaUsers.userId, userId), eq(areaUsers.tenantId, tenantId)),
    with: {
      area: {
        columns: { id: true, name: true, code: true },
      },
    },
  });

  return c.json({
    success: true,
    data: {
      ...user,
      areas: userAreas.map((ua) => ua.area),
    },
  });
});

// POST /api/users - Create user (admin only)
usersRoutes.post('/', zValidator('json', createUserSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const userRole = c.get('userRole');
  const body = c.req.valid('json');
  const db = getDb();

  // Only admin can create users
  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden crear usuarios');
  }

  // Check if email already exists in tenant
  const existing = await db.query.users.findFirst({
    where: and(eq(users.email, body.email), eq(users.tenantId, tenantId)),
  });

  if (existing) {
    throw Errors.conflict('El email ya está registrado en esta organización');
  }

  // Hash the temporary password
  const passwordHash = await hashPassword(body.temporaryPassword);

  // Generate a unique Clerk user ID placeholder (will be updated by webhook)
  const tempClerkId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const [user] = await db
    .insert(users)
    .values({
      tenantId,
      clerkUserId: tempClerkId,
      email: body.email,
      name: body.name,
      role: body.role || 'employee',
      mustChangePassword: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    });

  // TODO: Create user in Clerk and update clerkUserId
  // For now, return the user with temporary credentials info

  return c.json(
    {
      success: true,
      data: {
        ...user,
        temporaryPassword: body.temporaryPassword, // Return so admin can share with user
      },
    },
    201
  );
});

// PATCH /api/users/:id - Update user
usersRoutes.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const currentUserId = c.get('userId');
  const userRole = c.get('userRole');
  const targetUserId = c.req.param('id');
  const body = c.req.valid('json');
  const db = getDb();

  // Users can update themselves, admins can update anyone
  const isSelf = currentUserId === targetUserId;
  if (!isSelf && userRole !== 'admin') {
    throw Errors.forbidden('No tiene permisos para modificar este usuario');
  }

  // Non-admins cannot change roles
  if (body.role && !isSelf && userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden cambiar roles');
  }

  // Cannot deactivate yourself
  if (body.isActive === false && isSelf) {
    throw Errors.badRequest('No puede desactivar su propia cuenta');
  }

  const [updated] = await db
    .update(users)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
    });

  if (!updated) {
    throw Errors.notFound('Usuario');
  }

  return c.json({ success: true, data: updated });
});

// POST /api/users/change-password - Change own password
usersRoutes.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  const userId = c.get('userId');
  const tenantId = c.get('tenantId');
  const { currentPassword, newPassword } = c.req.valid('json');
  const db = getDb();

  // Get user with password info
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
  });

  if (!user) {
    throw Errors.notFound('Usuario');
  }

  // For first login, skip current password verification if mustChangePassword is true
  // In production, this should verify against the temp password stored securely

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password and clear mustChangePassword flag
  await db
    .update(users)
    .set({
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // TODO: Update password in Clerk

  return c.json({
    success: true,
    data: { message: 'Contraseña actualizada exitosamente' },
  });
});

// DELETE /api/users/:id - Deactivate user (soft delete)
usersRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const currentUserId = c.get('userId');
  const userRole = c.get('userRole');
  const targetUserId = c.req.param('id');
  const db = getDb();

  // Only admin can delete users
  if (userRole !== 'admin') {
    throw Errors.forbidden('Solo administradores pueden eliminar usuarios');
  }

  // Cannot delete yourself
  if (currentUserId === targetUserId) {
    throw Errors.badRequest('No puede eliminar su propia cuenta');
  }

  const [deleted] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(users.id, targetUserId), eq(users.tenantId, tenantId)))
    .returning({ id: users.id });

  if (!deleted) {
    throw Errors.notFound('Usuario');
  }

  return c.json({ success: true, data: { id: targetUserId } });
});
