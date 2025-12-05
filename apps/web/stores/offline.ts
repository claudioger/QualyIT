import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PendingCompletion {
  id: string;
  taskId: string;
  checklistResponses: Record<string, { checked: boolean; value?: string }>;
  notes?: string;
  photoUrls?: string[];
  completedAt: string;
  synced: boolean;
}

interface PendingFile {
  id: string;
  localUri: string;
  filename: string;
  contentType: string;
  synced: boolean;
}

interface OfflineState {
  isOnline: boolean;
  pendingCompletions: PendingCompletion[];
  pendingFiles: PendingFile[];
  lastSyncAt: number | null;
  syncInProgress: boolean;

  // Actions
  setIsOnline: (isOnline: boolean) => void;
  addPendingCompletion: (completion: PendingCompletion) => void;
  removePendingCompletion: (id: string) => void;
  markCompletionSynced: (id: string) => void;
  addPendingFile: (file: PendingFile) => void;
  removePendingFile: (id: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  clearSyncedItems: () => void;
  syncPendingCompletions: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingCompletions: [],
      pendingFiles: [],
      lastSyncAt: null,
      syncInProgress: false,

      setIsOnline: (isOnline) => set({ isOnline }),

      addPendingCompletion: (completion) =>
        set((state) => ({
          pendingCompletions: [...state.pendingCompletions, completion],
        })),

      removePendingCompletion: (id) =>
        set((state) => ({
          pendingCompletions: state.pendingCompletions.filter((c) => c.id !== id),
        })),

      markCompletionSynced: (id) =>
        set((state) => ({
          pendingCompletions: state.pendingCompletions.map((c) =>
            c.id === id ? { ...c, synced: true } : c
          ),
        })),

      addPendingFile: (file) =>
        set((state) => ({
          pendingFiles: [...state.pendingFiles, file],
        })),

      removePendingFile: (id) =>
        set((state) => ({
          pendingFiles: state.pendingFiles.filter((f) => f.id !== id),
        })),

      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      clearSyncedItems: () =>
        set((state) => ({
          pendingCompletions: state.pendingCompletions.filter((c) => !c.synced),
          pendingFiles: state.pendingFiles.filter((f) => !f.synced),
        })),

      syncPendingCompletions: async () => {
        const state = get();
        if (state.syncInProgress || !state.isOnline) return;

        const unsynced = state.pendingCompletions.filter((c) => !c.synced);
        if (unsynced.length === 0) return;

        set({ syncInProgress: true });

        try {
          for (const completion of unsynced) {
            try {
              const response = await fetch(`/api/tasks/${completion.taskId}/complete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  checklistResponses: completion.checklistResponses,
                  notes: completion.notes,
                  photoUrls: completion.photoUrls,
                }),
              });

              if (response.ok) {
                get().markCompletionSynced(completion.id);
              }
            } catch (error) {
              console.error('Failed to sync completion:', error);
            }
          }

          // Clean up synced items
          get().clearSyncedItems();
          set({ lastSyncAt: Date.now() });
        } finally {
          set({ syncInProgress: false });
        }
      },
    }),
    {
      name: 'qualyit-offline-storage',
      partialize: (state) => ({
        pendingCompletions: state.pendingCompletions,
        pendingFiles: state.pendingFiles,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
