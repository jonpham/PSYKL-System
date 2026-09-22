import { useCallback, useEffect, useState } from 'react';

import { listFailedOps, listSyncQueue } from '../db/idb';
import type { FailedOpEntry, SyncQueueEntry } from '../db/idb.types';
import { subscribeToListChanges } from './useLists';
import { subscribeToTaskChanges } from './useTasks';

interface UseSyncRecordsResult {
  failed: FailedOpEntry[];
  queued: SyncQueueEntry[];
}

/** The queued and permanently-failed operations behind the header's sync
 * control, reloaded on the same change notifications every mutation fires. */
function useSyncRecords(): UseSyncRecordsResult {
  const [records, setRecords] = useState<UseSyncRecordsResult>({ failed: [], queued: [] });

  const reload = useCallback(async () => {
    const [queued, failed] = await Promise.all([listSyncQueue(), listFailedOps()]);
    setRecords({ failed, queued });
  }, []);

  useEffect(() => {
    void reload();
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  return records;
}

export { useSyncRecords };
