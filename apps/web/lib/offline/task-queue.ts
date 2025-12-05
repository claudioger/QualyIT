/**
 * Task Queue for Offline Operations
 * Manages pending task completions that need to be synced when online
 */

import { openDB, IDBPDatabase } from 'idb';
import { requestBackgroundSync } from './sw-register';

const DB_NAME = 'qualyit-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-completions';

interface PendingCompletion {
  id: string;
  taskId: string;
  checklistItemId?: string;
  status: 'ok' | 'problem';
  notes?: string;
  problemReason?: 'no_time' | 'no_supplies' | 'equipment_broken' | 'other';
  problemDescription?: string;
  completedAt: string;
  synced: boolean;
  retryCount: number;
  createdAt: string;
}

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object store for pending completions
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('taskId', 'taskId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });

  return dbInstance;
}

/**
 * Add a completion to the offline queue
 */
export async function addToQueue(completion: Omit<PendingCompletion, 'retryCount' | 'createdAt'>): Promise<void> {
  const db = await getDB();

  const record: PendingCompletion = {
    ...completion,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  await db.put(STORE_NAME, record);

  // Try to trigger background sync
  await requestBackgroundSync('sync-completions');
}

/**
 * Get all pending (unsynced) completions
 */
export async function getPendingCompletions(): Promise<PendingCompletion[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.filter((c) => !c.synced);
}

/**
 * Get completions for a specific task
 */
export async function getCompletionsForTask(taskId: string): Promise<PendingCompletion[]> {
  const db = await getDB();
  const index = db.transaction(STORE_NAME).store.index('taskId');
  return index.getAll(taskId);
}

/**
 * Mark a completion as synced
 */
export async function markAsSynced(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);

  if (record) {
    record.synced = true;
    await db.put(STORE_NAME, record);
  }
}

/**
 * Increment retry count for a failed sync
 */
export async function incrementRetryCount(id: string): Promise<void> {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);

  if (record) {
    record.retryCount += 1;
    await db.put(STORE_NAME, record);
  }
}

/**
 * Remove a completion from the queue (after successful sync)
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Clean up old synced completions (older than 7 days)
 */
export async function cleanupOldCompletions(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const record of all) {
    if (record.synced && new Date(record.createdAt) < sevenDaysAgo) {
      await db.delete(STORE_NAME, record.id);
    }
  }
}

/**
 * Get the count of pending completions
 */
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingCompletions();
  return pending.length;
}

/**
 * Sync all pending completions with the server
 */
export async function syncPendingCompletions(): Promise<{
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const pending = await getPendingCompletions();
  const results = {
    synced: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  if (pending.length === 0) {
    return results;
  }

  try {
    // Try batch sync first
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        completions: pending.map((c) => ({
          offlineId: c.id,
          taskId: c.taskId,
          checklistItemId: c.checklistItemId,
          status: c.status,
          notes: c.notes,
          completedAt: c.completedAt,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const data = await response.json();

    // Mark successful completions as synced
    for (const result of data.data.completions || []) {
      if (result.status === 'created' || result.status === 'duplicate') {
        await removeFromQueue(result.offlineId);
        results.synced++;
      }
    }

    // Handle errors
    for (const error of data.data.errors || []) {
      await incrementRetryCount(error.offlineId);
      results.failed++;
      results.errors.push({ id: error.offlineId, error: error.error });
    }
  } catch (error) {
    // If batch fails, try individual sync
    for (const completion of pending) {
      try {
        const response = await fetch(`/api/tasks/${completion.taskId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: completion.status,
            notes: completion.notes,
            problemReason: completion.problemReason,
            problemDescription: completion.problemDescription,
          }),
        });

        if (response.ok) {
          await removeFromQueue(completion.id);
          results.synced++;
        } else {
          await incrementRetryCount(completion.id);
          results.failed++;
          results.errors.push({ id: completion.id, error: `HTTP ${response.status}` });
        }
      } catch (err) {
        await incrementRetryCount(completion.id);
        results.failed++;
        results.errors.push({
          id: completion.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}
