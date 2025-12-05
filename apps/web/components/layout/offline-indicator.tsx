'use client';

import { useOfflineStore } from '@/stores/offline';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, pendingCompletions, syncInProgress } = useOfflineStore();

  // Don't show if online and no pending items
  if (isOnline && pendingCompletions.length === 0) {
    return null;
  }

  const pendingCount = pendingCompletions.filter((c) => !c.synced).length;

  return (
    <div
      className={cn(
        'sticky top-0 z-40 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white',
        isOnline ? 'bg-amber-500' : 'bg-red-500'
      )}
    >
      {isOnline ? (
        <>
          <RefreshCw
            className={cn('h-4 w-4', syncInProgress && 'animate-spin')}
          />
          <span>
            {syncInProgress
              ? 'Sincronizando...'
              : `${pendingCount} ${pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'} de sincronizar`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Sin conexión - Los cambios se guardarán localmente</span>
        </>
      )}
    </div>
  );
}
