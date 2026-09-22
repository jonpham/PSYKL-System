import { useCallback, useEffect, useState } from 'react';

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

  const reload = useCallback(async () => {
    const [queued, failed, replacedEdits] = await Promise.all([listSyncQueue(), listFailedOps(), listStaleWrites()]);
    setRecords({ failed, queued, replacedEdits });
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

  const dismissReplacedEdit = useCallback(
    (id: string) => {
      void dismissStaleWrite(id).then(reload);
    },
    [reload],
  );

  return { ...records, dismissReplacedEdit };
}

export { useSyncRecords };
