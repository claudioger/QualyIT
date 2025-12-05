import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../lib/db';
import { uploadedFiles } from '@qualyit/database/schema';
import { getPresignedUploadUrl, deleteFile } from '../lib/storage';
import { Errors } from '../middleware/error';
import type { Env } from '../index';

// Validation schemas
const presignedUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  path: z.enum(['task-completions', 'problems', 'avatars']),
  entityId: z.string().uuid().optional(),
});

const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  taskCompletionId: z.string().uuid().optional(),
  problemId: z.string().uuid().optional(),
});

export const uploadsRoutes = new Hono<Env>();

// POST /api/uploads/presigned - Get presigned URL for upload (T067)
uploadsRoutes.post('/presigned', zValidator('json', presignedUploadSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const body = c.req.valid('json');

  try {
    const result = await getPresignedUploadUrl(
      tenantId,
      body.path,
      body.filename,
      body.contentType,
      3600 // 1 hour expiry
    );

    return c.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        storageKey: result.key,
        publicUrl: result.publicUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    // If storage is not configured, return a placeholder for development
    if (process.env.NODE_ENV === 'development') {
      const mockKey = `${tenantId}/${body.path}/${Date.now()}-${body.filename}`;
      return c.json({
        success: true,
        data: {
          uploadUrl: `http://localhost:3000/api/uploads/mock/${mockKey}`,
          storageKey: mockKey,
          publicUrl: `http://localhost:3000/uploads/${mockKey}`,
          expiresIn: 3600,
          isDevelopment: true,
        },
      });
    }
    throw error;
  }
});

// POST /api/uploads/confirm - Confirm upload and save metadata
uploadsRoutes.post('/confirm', zValidator('json', confirmUploadSchema), async (c) => {
  const tenantId = c.get('tenantId');
  const body = c.req.valid('json');
  const db = getDb();

  // Must have either taskCompletionId or problemId
  if (!body.taskCompletionId && !body.problemId) {
    throw Errors.badRequest('Se requiere taskCompletionId o problemId');
  }

  const [file] = await db
    .insert(uploadedFiles)
    .values({
      tenantId,
      storageKey: body.storageKey,
      filename: body.filename,
      contentType: body.contentType,
      sizeBytes: body.sizeBytes,
      taskCompletionId: body.taskCompletionId,
      problemId: body.problemId,
      syncedAt: new Date(),
    })
    .returning();

  return c.json({ success: true, data: file }, 201);
});

// GET /api/uploads/:id - Get file metadata
uploadsRoutes.get('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const fileId = c.req.param('id');
  const db = getDb();

  const file = await db.query.uploadedFiles.findFirst({
    where: and(eq(uploadedFiles.id, fileId), eq(uploadedFiles.tenantId, tenantId)),
  });

  if (!file) {
    throw Errors.notFound('Archivo');
  }

  return c.json({ success: true, data: file });
});

// DELETE /api/uploads/:id - Delete a file
uploadsRoutes.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const fileId = c.req.param('id');
  const db = getDb();

  const file = await db.query.uploadedFiles.findFirst({
    where: and(eq(uploadedFiles.id, fileId), eq(uploadedFiles.tenantId, tenantId)),
  });

  if (!file) {
    throw Errors.notFound('Archivo');
  }

  // Delete from storage
  try {
    await deleteFile(file.storageKey);
  } catch (error) {
    // Log but continue - file might already be deleted
    console.error('Error deleting file from storage:', error);
  }

  // Delete record
  await db.delete(uploadedFiles).where(eq(uploadedFiles.id, fileId));

  return c.json({ success: true, data: { id: fileId } });
});

// POST /api/uploads/batch-presigned - Get multiple presigned URLs at once
uploadsRoutes.post('/batch-presigned', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  if (!Array.isArray(body.files) || body.files.length === 0) {
    throw Errors.badRequest('Se requiere un array de archivos');
  }

  if (body.files.length > 10) {
    throw Errors.badRequest('Máximo 10 archivos por solicitud');
  }

  const results = await Promise.all(
    body.files.map(async (file: { filename: string; contentType: string; path: string }) => {
      try {
        const result = await getPresignedUploadUrl(
          tenantId,
          file.path,
          file.filename,
          file.contentType,
          3600
        );
        return {
          filename: file.filename,
          uploadUrl: result.uploadUrl,
          storageKey: result.key,
          publicUrl: result.publicUrl,
        };
      } catch (error) {
        // For development without R2
        if (process.env.NODE_ENV === 'development') {
          const mockKey = `${tenantId}/${file.path}/${Date.now()}-${file.filename}`;
          return {
            filename: file.filename,
            uploadUrl: `http://localhost:3000/api/uploads/mock/${mockKey}`,
            storageKey: mockKey,
            publicUrl: `http://localhost:3000/uploads/${mockKey}`,
            isDevelopment: true,
          };
        }
        throw error;
      }
    })
  );

  return c.json({ success: true, data: results });
});
