import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { rlsMiddleware } from './middleware/rls';

// Import routes
import { tenantsRoutes } from './routes/tenants';
import { areasRoutes } from './routes/areas';
import { usersRoutes } from './routes/users';
import { tasksRoutes } from './routes/tasks';
import { problemsRoutes } from './routes/problems';
import { notificationsRoutes } from './routes/notifications';
import { uploadsRoutes } from './routes/uploads';
import { syncRoutes } from './routes/sync';
import { dashboardRoutes } from './routes/dashboard';

// Type for Hono context with our custom variables
export type Env = {
  Variables: {
    tenantId: string;
    userId: string;
    userRole: string;
    clerkUserId: string;
  };
};

// Create the Hono app
const app = new Hono<Env>();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow localhost in development
      if (process.env.NODE_ENV === 'development') {
        return origin;
      }
      // Allow *.qualyit.app in production
      if (origin.endsWith('.qualyit.app')) {
        return origin;
      }
      return null;
    },
    credentials: true,
  })
);

// Error handling
app.use('*', errorHandler);

// Health check (no auth required)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply auth, tenant, and RLS middleware to all /api routes
app.use('/api/*', authMiddleware);
app.use('/api/*', tenantMiddleware);
app.use('/api/*', rlsMiddleware);

// Mount routes
app.route('/api/tenants', tenantsRoutes);
app.route('/api/areas', areasRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/problems', problemsRoutes);
app.route('/api/notifications', notificationsRoutes);
app.route('/api/uploads', uploadsRoutes);
app.route('/api/sync', syncRoutes);
app.route('/api/dashboard', dashboardRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint no encontrado',
      },
    },
    404
  );
});

export default app;
export { app };
