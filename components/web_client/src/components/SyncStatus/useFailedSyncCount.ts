import { useCallback, useEffect, useState } from 'react';

import { listFailedOps } from '../../db/idb';
import { subscribeToListChanges } from '../../hooks/useLists';
import { subscribeToTaskChanges } from '../../hooks/useTasks';

function useFailedSyncCount(): number {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    const failedOps = await listFailedOps();
    setCount(failedOps.length);
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

  return count;
}

export { useFailedSyncCount };
