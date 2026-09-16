import { useCallback, useEffect, useState } from 'react';

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

  const reload = useCallback(async () => {
    const queue = await listSyncQueue();
    setCount(queue.length);
  }, []);

  useEffect(() => {
    void reload();
    // Same live-update pattern as useRecentlyDeleted.ts: enqueueWithReplay's
    // notify() fires right after every enqueue and again after every
    // replay() drain, so subscribing here catches both queue growth and
    // queue drain without a new IDB change-event API.
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  return { count, level: syncDiscrepancyLevel(count) };
}

export { useSyncDiscrepancy };
export type { UseSyncDiscrepancyResult };
