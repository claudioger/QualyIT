'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-muted-foreground mb-6">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="text-left text-xs bg-muted p-4 rounded-lg mb-6 overflow-auto max-h-40">
            <p className="font-mono text-destructive">{error.message}</p>
            {error.digest && (
              <p className="text-muted-foreground mt-2">Digest: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button onClick={() => (window.location.href = '/')}>
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
