import { useCallback } from 'react';

import type { DeleteListMode } from '../components/DeleteListDialog';
import { useActiveListId } from './useActiveList';
import { useLists } from './useLists';
import { useTasks } from './useTasks';

interface ListDeletion {
  /** Live tasks in the active list — what a delete stands to take with it. */
  activeListItemCount: number;
  deleteActiveList(mode: DeleteListMode): Promise<void>;
}

/**
 * Deleting the active list, and deciding what becomes of the tasks inside it.
 *
 * Scoped to the active list because that is the only list the app offers to
 * delete: the control lives in the list surface's own overflow menu, and
 * `useTasks` is already scoped the same way, so its tasks are exactly the ones
 * at stake.
 *
 * Both outcomes are client-orchestrated batches over the calls a single row
 * already uses — no endpoint of its own:
 *
 * - **With items** tombstones every task, then the list, all sharing one
 *   `deleted_at`. That shared stamp is what lets Recently Deleted show them as
 *   one undoable unit (`useRecentlyDeleted`). The tasks settle first because the
 *   service re-homes any task whose list is already gone
 *   (`task-orphan-sweep.ts`), which would strand them in the default list.
 * - **Just the list** moves the tasks to the default list — the earliest-position
 *   live list, which is the same list the service's own sweep would pick — and
 *   then tombstones the list. Only live tasks move: patching a tombstoned task
 *   would resurrect it (`task.service.ts` clears `deletedAt` on every patch), and
 *   a task deleted earlier belongs to its own deletion, not to this one.
 */
function useListDeletion(): ListDeletion {
  const { deleteList, lists } = useLists();
  const { deleteTask, patchTask, tasks } = useTasks();
  const activeListId = useActiveListId();

  const deleteActiveList = useCallback(
    async (mode: DeleteListMode): Promise<void> => {
      const listId = activeListId ?? lists[0]?.id;
      if (listId === undefined) {
        return;
      }
      const now = new Date().toISOString();

      if (mode === 'with-items') {
        await Promise.allSettled(
          tasks.map((task) =>
            deleteTask(task.id, { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now }),
          ),
        );
        await deleteList(listId, now);
        return;
      }

      // `lists` is position-ordered, so the first list that is not this one is
      // the default list. A list with nowhere to send its items still deletes:
      // the service's orphan sweep is the backstop.
      const destination = lists.find((list) => list.id !== listId);
      if (destination) {
        await Promise.allSettled(
          tasks.map((task) =>
            patchTask(
              task.id,
              { list_id: destination.id, updated_at: now },
              { ...task, list_id: destination.id, updated_at: now },
            ),
          ),
        );
      }
      await deleteList(listId, now);
    },
    [activeListId, deleteList, deleteTask, lists, patchTask, tasks],
  );

  return { activeListItemCount: tasks.length, deleteActiveList };
}

export { useListDeletion };
