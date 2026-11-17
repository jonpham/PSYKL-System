import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import type { Task } from '../api/client';
import { listDeletedRemote } from '../api/deleted.api-client';
import type { ListRecord } from '../db/idb.types';
import { LISTS_QUERY_KEY, RECENTLY_DELETED_QUERY_KEY, TASKS_QUERY_KEY } from './query-keys';
import type { UseRecentlyDeletedResult } from './useRecentlyDeleted';
import { cascadedWith, type DeletedItem, toDeletedItems } from './useRecentlyDeleted.items';
import { useServiceClients } from './useServiceClients';

interface DeletedRows {
  lists: ListRecord[];
  tasks: Task[];
}

const NO_ROWS: DeletedRows = { lists: [], tasks: [] };

/**
 * Recently Deleted with Offline Mode off: what the server's `GET /deleted`
 * holds, and a restore that waits for the server (Spec 3 decision S3-2).
 * Whatever a restore's answer, Recently Deleted, Lists and Tasks are read
 * again, so the screen matches the server even when a list came back and one
 * of its tasks did not (S4-2). Deletes on this path refresh this read too.
 */
function useRecentlyDeletedApiClient(): UseRecentlyDeletedResult {
  const { lists: listServiceClient, tasks: taskServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const { data = NO_ROWS } = useQuery({ queryFn: fetchDeleted, queryKey: RECENTLY_DELETED_QUERY_KEY });
  const items = useMemo(() => toDeletedItems(data.tasks, data.lists), [data]);

  const restore = useCallback(
    async (item: DeletedItem): Promise<void> => {
      const updated_at = new Date().toISOString();
      try {
        if (item.type === 'task') {
          const existing = data.tasks.find((row) => row.id === item.id);
          if (existing) {
            await taskServiceClient.restore(item.id, { updated_at }, { ...existing, deleted_at: null });
          }
          return;
        }
        const existing = data.lists.find((row) => row.id === item.id);
        if (!existing) {
          return;
        }
        await listServiceClient.restore(item.id, { updated_at }, { ...existing, deleted_at: null });
        // The list and its items left together, so they come back together.
        for (const row of cascadedWith(existing, data.tasks)) {
          await taskServiceClient.restore(row.id, { updated_at }, { ...row, deleted_at: null });
        }
      } finally {
        await Promise.all(
          [RECENTLY_DELETED_QUERY_KEY, LISTS_QUERY_KEY, TASKS_QUERY_KEY].map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
    },
    [data, listServiceClient, queryClient, taskServiceClient],
  );

  return { items, restore };
}

async function fetchDeleted(): Promise<DeletedRows> {
  const result = await listDeletedRemote();
  if (result.error || !result.data) {
    throw new Error(`Recently Deleted read failed: ${String(result.status)}`);
  }
  return { lists: result.data.lists, tasks: result.data.tasks };
}

export { useRecentlyDeletedApiClient };
