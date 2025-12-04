import { useCallback, useEffect, useRef, useState } from 'react';

interface ServiceWorkerUpdateState {
  hasUpdate: boolean;
  isRefreshing: boolean;
  refreshApp: () => void;
}

/**
 * Listen for service worker updates and expose a simple API
 * to trigger a refresh when a new version is available.
 */
const useServiceWorkerUpdate = (): ServiceWorkerUpdateState => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    refreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isMounted = true;
    let cleanupUpdateFound: (() => void) | null = null;

    const handleControllerChange = () => {
      if (refreshingRef.current) {
        return;
      }
      refreshingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready
      .then((registration) => {
        if (!isMounted) {
          return;
        }

        registrationRef.current = registration;

        const checkWaitingWorker = () => {
          if (registration.waiting) {
            setHasUpdate(true);
          }
        };

        const handleUpdateFound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setHasUpdate(true);
            }
          });
        };

        checkWaitingWorker();
        registration.addEventListener('updatefound', handleUpdateFound);
        cleanupUpdateFound = () => {
          registration.removeEventListener('updatefound', handleUpdateFound);
        };
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (cleanupUpdateFound) {
        cleanupUpdateFound();
      }
    };
  }, []);

  const refreshApp = useCallback(() => {
    const registration = registrationRef.current;

    if (!registration) {
      window.location.reload();
      return;
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsRefreshing(true);
      setHasUpdate(false);
    } else {
      window.location.reload();
    }
  }, []);

  return {
    hasUpdate,
    isRefreshing,
    refreshApp,
  };
};

export default useServiceWorkerUpdate;
