import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchAvailableWebVersion, getWebCommit } from '../api/version';

type AppUpdateStatus = 'checking' | 'failed' | 'up-to-date' | 'update-available' | 'updating';

interface UseAppUpdateOptions {
  /** Defaults to `navigator.serviceWorker`; injected in tests. */
  container?: ServiceWorkerContainer | undefined;
  /** How long to wait for the new worker to take control before reloading anyway. */
  handshakeTimeoutMs?: number;
  /** Defaults to a full page reload; injected in tests. */
  reload?: () => void;
}

interface AppUpdate {
  /** Activate the waiting worker (if any) and reload onto the new bundle. */
  applyUpdate: () => void;
  availableCommit: string | null;
  currentCommit: string;
  /** When the last successful check completed — the "Last checked" stamp. */
  lastCheckedAt: Date | null;
  recheck: () => void;
  status: AppUpdateStatus;
}

const skipWaitingMessage = { type: 'PSYKL_SKIP_WAITING' } as const;
const defaultHandshakeTimeoutMs = 5_000;

/**
 * Tracks the web bundle the user is running against the one the origin is
 * serving, and performs the service-worker handshake that swaps one for the
 * other. Without this the replacement worker registered by a new deploy stays
 * in `waiting` forever on an installed PWA, because `src/sw.ts` claims clients
 * but never calls `skipWaiting()` on its own.
 */
function useAppUpdate(options: UseAppUpdateOptions = {}): AppUpdate {
  const { handshakeTimeoutMs = defaultHandshakeTimeoutMs, reload } = options;
  const container = 'container' in options ? options.container : globalThis.navigator?.serviceWorker;

  const currentCommit = getWebCommit();
  const [status, setStatus] = useState<AppUpdateStatus>('checking');
  const [availableCommit, setAvailableCommit] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const check = useCallback(async () => {
    setStatus('checking');
    // Ask the browser to re-fetch sw.js so a replacement worker is installed
    // and waiting by the time the user presses the button.
    try {
      const registration = await container?.getRegistration();
      await registration?.update();
    } catch {
      // An unavailable or failing worker must not block the version read.
    }

    try {
      const commit = await fetchAvailableWebVersion();
      if (!mounted.current) return;
      setAvailableCommit(commit);
      setLastCheckedAt(new Date());
      setStatus(commit === currentCommit ? 'up-to-date' : 'update-available');
    } catch {
      if (!mounted.current) return;
      setAvailableCommit(null);
      setStatus('failed');
    }
  }, [container, currentCommit]);

  useEffect(() => {
    void check();
  }, [check]);

  const applyUpdate = useCallback(() => {
    setStatus('updating');
    void (async () => {
      const registration = await container?.getRegistration().catch(() => null);
      const waiting = registration?.waiting;
      if (!waiting || !container) {
        reloadPage(reload);
        return;
      }

      const tookControl = new Promise<void>((resolve) => {
        const onControllerChange = () => {
          container.removeEventListener('controllerchange', onControllerChange);
          resolve();
        };
        container.addEventListener('controllerchange', onControllerChange);
      });

      waiting.postMessage(skipWaitingMessage);

      // Reload either way: a worker that never takes control must not leave
      // the user stuck on "Updating…".
      await Promise.race([tookControl, delay(handshakeTimeoutMs)]);
      reloadPage(reload);
    })();
  }, [container, handshakeTimeoutMs, reload]);

  return {
    applyUpdate,
    availableCommit,
    currentCommit,
    lastCheckedAt,
    recheck: () => void check(),
    status,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reloadPage(reload: (() => void) | undefined): void {
  if (reload) {
    reload();
    return;
  }
  globalThis.location.reload();
}

export { type AppUpdate, type AppUpdateStatus, useAppUpdate, type UseAppUpdateOptions };
