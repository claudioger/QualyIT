import { handle } from 'hono/vercel';
import app from '@qualyit/api';

// Use Node.js runtime since we need crypto module for password hashing
export const runtime = 'nodejs';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
