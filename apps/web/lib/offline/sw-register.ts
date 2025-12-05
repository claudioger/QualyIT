/**
 * Service Worker Registration
 * Registers the PWA service worker for offline support
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New version available');
            // Could show a toast here to reload
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Request a background sync
 * Used to sync offline completions when back online
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-expect-error - sync is not in the type definitions yet
    await registration.sync.register(tag);
    console.log('Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('Background sync registration failed:', error);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}
