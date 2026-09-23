import { useEffect, useState } from 'react';

import { listFailedOps } from '../../db/idb';
import { subscribeToListChanges } from '../../hooks/useLists';
import { subscribeToTaskChanges } from '../../hooks/useTasks';

function useFailedSyncCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // The read is async, so it can land after this component is gone — a
    // change notification arriving just before unmount, or a test tearing its
    // environment down. Storing the result then is at best a no-op and at
    // worst a crash: React reaches for `window` to schedule the update, and in
    // a torn-down jsdom there is no longer one, which surfaces as an unhandled
    // rejection rather than a failing assertion.
    let active = true;

    const reload = async () => {
      const failedOps = await listFailedOps();
      if (active) {
        setCount(failedOps.length);
      }
    };

    void reload();
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      active = false;
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, []);

  return count;
}

export { useFailedSyncCount };
