import { createDb, type Database } from '@qualyit/database';

// Singleton database instance
let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    db = createDb(connectionString);
  }
  return db;
}

// For testing purposes
export function resetDb() {
  db = null;
}
