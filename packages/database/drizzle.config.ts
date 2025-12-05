import { defineConfig } from 'drizzle-kit';

// Try to load .env from root (Node.js 20+)
try {
  process.loadEnvFile('../../.env');
} catch {
  // Ignore if not available
}

// Determine if we're connecting to local PostgreSQL or Neon
const isLocalDb = process.env.DATABASE_URL?.includes('localhost') ||
                  process.env.DATABASE_URL?.includes('127.0.0.1');

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Use standard pg driver for local development
  ...(isLocalDb ? { driver: undefined } : {}),
  verbose: true,
  strict: true,
});
