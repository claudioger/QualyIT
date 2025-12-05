/**
 * IndexedDB Store for Offline Data
 * Caches tasks, areas, and user data for offline access
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'qualyit-cache';
const DB_VERSION = 1;

const STORES = {
  tasks: 'tasks',
  areas: 'areas',
  users: 'users',
  meta: 'meta',
} as const;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tasks store
      if (!db.objectStoreNames.contains(STORES.tasks)) {
        const taskStore = db.createObjectStore(STORES.tasks, { keyPath: 'id' });
        taskStore.createIndex('areaId', 'areaId', { unique: false });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('dueDate', 'dueDate', { unique: false });
      }

      // Areas store
      if (!db.objectStoreNames.contains(STORES.areas)) {
        const areaStore = db.createObjectStore(STORES.areas, { keyPath: 'id' });
        areaStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // Users store
      if (!db.objectStoreNames.contains(STORES.users)) {
        db.createObjectStore(STORES.users, { keyPath: 'id' });
      }

      // Meta store for sync timestamps
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ============ Tasks ============

export async function cacheTasks(tasks: unknown[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.tasks, 'readwrite');

  for (const task of tasks) {
    await tx.store.put(task);
  }

  await tx.done;
  await updateSyncTimestamp('tasks');
}

export async function getCachedTasks(): Promise<unknown[]> {
  const db = await getDB();
  return db.getAll(STORES.tasks);
}

export async function getCachedTask(id: string): Promise<unknown | undefined> {
  const db = await getDB();
  return db.get(STORES.tasks, id);
}

export async function getCachedTasksByArea(areaId: string): Promise<unknown[]> {
  const db = await getDB();
  const index = db.transaction(STORES.tasks).store.index('areaId');
  return index.getAll(areaId);
}

export async function getCachedPendingTasks(): Promise<unknown[]> {
  const db = await getDB();
  const all = await db.getAll(STORES.tasks);
  return all.filter(
    (t: { status?: string }) => t.status === 'pending' || t.status === 'in_progress'
  );
}

export async function updateCachedTask(id: string, updates: Partial<unknown>): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORES.tasks, id);

  if (existing) {
    await db.put(STORES.tasks, { ...existing, ...updates });
  }
}

export async function deleteCachedTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.tasks, id);
}

// ============ Areas ============

export async function cacheAreas(areas: unknown[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.areas, 'readwrite');

  for (const area of areas) {
    await tx.store.put(area);
  }

  await tx.done;
  await updateSyncTimestamp('areas');
}

export async function getCachedAreas(): Promise<unknown[]> {
  const db = await getDB();
  return db.getAll(STORES.areas);
}

export async function getCachedArea(id: string): Promise<unknown | undefined> {
  const db = await getDB();
  return db.get(STORES.areas, id);
}

// ============ Users ============

export async function cacheUsers(users: unknown[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.users, 'readwrite');

  for (const user of users) {
    await tx.store.put(user);
  }

  await tx.done;
  await updateSyncTimestamp('users');
}

export async function getCachedUsers(): Promise<unknown[]> {
  const db = await getDB();
  return db.getAll(STORES.users);
}

export async function getCachedUser(id: string): Promise<unknown | undefined> {
  const db = await getDB();
  return db.get(STORES.users, id);
}

// ============ Meta / Sync ============

export async function updateSyncTimestamp(store: string): Promise<void> {
  const db = await getDB();
  await db.put(STORES.meta, {
    key: `lastSync_${store}`,
    value: new Date().toISOString(),
  });
}

export async function getLastSyncTimestamp(store: string): Promise<string | null> {
  const db = await getDB();
  const record = await db.get(STORES.meta, `lastSync_${store}`);
  return record?.value ?? null;
}

export async function clearAllCache(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORES.tasks, STORES.areas, STORES.users, STORES.meta], 'readwrite');

  await Promise.all([
    tx.objectStore(STORES.tasks).clear(),
    tx.objectStore(STORES.areas).clear(),
    tx.objectStore(STORES.users).clear(),
    tx.objectStore(STORES.meta).clear(),
  ]);

  await tx.done;
}

// ============ Sync ============

export async function syncFromServer(): Promise<{
  tasks: number;
  areas: number;
}> {
  const lastTaskSync = await getLastSyncTimestamp('tasks');
  const lastAreaSync = await getLastSyncTimestamp('areas');

  const response = await fetch('/api/sync/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      lastSyncedAt: lastTaskSync || undefined,
      entityTypes: ['tasks', 'areas'],
    }),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const data = await response.json();
  const result = { tasks: 0, areas: 0 };

  if (data.data.tasks?.length) {
    await cacheTasks(data.data.tasks);
    result.tasks = data.data.tasks.length;
  }

  if (data.data.areas?.length) {
    await cacheAreas(data.data.areas);
    result.areas = data.data.areas.length;
  }

  return result;
}

// ============ Offline-first Helpers ============

/**
 * Get tasks with offline-first strategy
 * Returns cached data immediately, then fetches fresh data in background
 */
export async function getTasksOfflineFirst(
  onFreshData?: (tasks: unknown[]) => void
): Promise<unknown[]> {
  // Return cached immediately
  const cached = await getCachedTasks();

  // Fetch fresh in background if online
  if (navigator.onLine) {
    syncFromServer()
      .then(async () => {
        const fresh = await getCachedTasks();
        if (onFreshData) {
          onFreshData(fresh);
        }
      })
      .catch(console.error);
  }

  return cached;
}
