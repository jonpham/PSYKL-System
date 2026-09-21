import { useCallback, useEffect, useRef, useState } from 'react';

import { listSyncQueue } from '../db/idb';
import { type SyncDiscrepancyLevel, syncDiscrepancyLevel } from '../sync/sync-discrepancy';
import { subscribeToListChanges } from './useLists';
import { subscribeToTaskChanges } from './useTasks';

/**
 * Tracks how many local changes are queued for sync but haven't reached the
 * server yet — the gap ("discrepancy") between what this device has done
 * and what the server has confirmed. Drives the offline UI: a banner nags
 * the user once enough changes pile up, and new writes are refused past a
 * hard ceiling (see sync/sync-discrepancy.ts's thresholds).
 */
interface UseSyncDiscrepancyResult {
  count: number;
  level: SyncDiscrepancyLevel;
}

function useSyncDiscrepancy(): UseSyncDiscrepancyResult {
  const [count, setCount] = useState(0);
  // A reload() started before unmount still resolves afterwards. Writing state
  // then is harmless in a browser but throws under test, where jsdom's globals
  // are gone the moment the test ends — surfacing as an unhandled
  // "window is not defined" that fails the run (see Root.unit.test.tsx).
  const mountedRef = useRef(true);

  const reload = useCallback(async () => {
    const queue = await listSyncQueue();
    if (!mountedRef.current) {
      return;
    }
    setCount(queue.length);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void reload();
    // Same live-update pattern as useRecentlyDeleted.ts: enqueueWithReplay's
    // notify() fires right after every enqueue and again after every
    // replay() drain, so subscribing here catches both queue growth and
    // queue drain without a new IDB change-event API.
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      mountedRef.current = false;
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  return { count, level: syncDiscrepancyLevel(count) };
}

export { useSyncDiscrepancy };
export type { UseSyncDiscrepancyResult };
