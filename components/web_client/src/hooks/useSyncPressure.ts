import { useCallback, useEffect, useState } from 'react';

import { listSyncQueue } from '../db/idb';
import { type SyncPressureLevel, syncPressureLevel } from '../sync/sync-pressure';
import { subscribeToListChanges } from './useLists';
import { subscribeToTaskChanges } from './useTasks';

interface UseSyncPressureResult {
  count: number;
  level: SyncPressureLevel;
}

function useSyncPressure(): UseSyncPressureResult {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    const queue = await listSyncQueue();
    setCount(queue.length);
  }, []);

  useEffect(() => {
    void reload();
    // Same live-update pattern as useRecentlyDeleted.ts (DevTask 11):
    // enqueueWithReplay's notify() fires right after every enqueue and
    // again after every replay() drain, so subscribing here catches both
    // queue growth and queue drain without a new IDB change-event API.
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  return { count, level: syncPressureLevel(count) };
}

export { useSyncPressure };
export type { UseSyncPressureResult };
