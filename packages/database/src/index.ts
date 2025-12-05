import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create a database client
// Usage: const db = createDb(process.env.DATABASE_URL!)
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// Export schema for use in other packages
export * from './schema';

// Export drizzle-orm operators for queries
export { eq, and, or, gt, lt, gte, lte, ne, inArray, notInArray, isNull, isNotNull, desc, asc } from 'drizzle-orm';

// Export types
export type Database = ReturnType<typeof createDb>;
