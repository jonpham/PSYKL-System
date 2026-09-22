import { useCallback, useEffect, useRef, useState } from 'react';

import { listFailedOps, listSyncQueue } from '../db/idb';
import type { FailedOpEntry, SyncQueueEntry } from '../db/idb.types';
import { dismissStaleWrite, listStaleWrites, type StaleWriteRecord } from '../preferences/staleWrites';
import { subscribeToListChanges } from './useLists';
import { subscribeToTaskChanges } from './useTasks';

interface UseSyncRecordsResult {
  dismissReplacedEdit(id: string): void;
  failed: FailedOpEntry[];
  queued: SyncQueueEntry[];
  replacedEdits: StaleWriteRecord[];
}

type SyncRecords = Omit<UseSyncRecordsResult, 'dismissReplacedEdit'>;

/** The queued and permanently-failed operations behind the header's sync
 * control, reloaded on the same change notifications every mutation fires. */
function useSyncRecords(): UseSyncRecordsResult {
  const [records, setRecords] = useState<SyncRecords>({ failed: [], queued: [], replacedEdits: [] });
  // Three IndexedDB reads settle well after a change notification fires, and
  // the page can be gone by then — a sync record arriving for a screen nobody
  // is looking at must not be written back into a component that has left.
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    const [queued, failed, replacedEdits] = await Promise.all([listSyncQueue(), listFailedOps(), listStaleWrites()]);
    if (mounted.current) {
      setRecords({ failed, queued, replacedEdits });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      mounted.current = false;
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  const dismissReplacedEdit = useCallback(
    (id: string) => {
      void dismissStaleWrite(id).then(reload);
    },
    [reload],
  );

  return { ...records, dismissReplacedEdit };
}

export { useSyncRecords };
