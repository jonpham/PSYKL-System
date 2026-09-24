import { useEffect, useState } from 'react';

import type { Task } from '../../api/client';
import { taskServiceClient } from '../../services/task-service-client';

/**
 * The ids of the tasks with writes still queued for the server.
 *
 * Re-read whenever the list changes, because that is when a write was just
 * made or a replay just landed. State is returned unchanged when the answer is
 * unchanged, so an idle list does not re-render on every sync tick.
 */
function usePendingTaskIds(tasks: Task[]): Set<string> {
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0) {
      setPendingTaskIds((current) => (current.size === 0 ? current : new Set()));
      return;
    }

    if (typeof indexedDB === 'undefined') {
      return;
    }

    let cancelled = false;
    void taskServiceClient.listPending().then((ids) => {
      if (!cancelled) {
        setPendingTaskIds((current) => {
          if (ids.length === 0 && current.size === 0) {
            return current;
          }
          return new Set(ids);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  return pendingTaskIds;
}

export { usePendingTaskIds };
