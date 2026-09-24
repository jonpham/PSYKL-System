import { useEffect, useState } from 'react';

import type { Task } from '../../api/client';
import { useTasks } from '../../hooks/useTasks';

interface TaskSelection {
  /** A batch is in flight: the pool is frozen until every call settles. */
  busy: boolean;
  deleteSelected: () => Promise<void>;
  moveSelected: (listId: string) => Promise<void>;
  moving: boolean;
  /** The pooled tasks, in the order they appear on screen. */
  selected: Task[];
  selectedIds: Set<string>;
  toggleSelectedCompletion: () => Promise<void>;
  setMoving: (moving: boolean) => void;
  toggleSelected: (id: string) => void;
}

/**
 * The batch a user has pooled in selection mode, and the actions that apply to
 * it.
 *
 * Each action goes through the same `useTasks` calls a single row uses, and
 * treats them as plain async service calls — whether a sync queue sits behind
 * them is the client's business, not this hook's. The batch is issued at once
 * and awaited as a whole: the pool is frozen while it is in flight, one
 * rejection never strands the tasks behind it, and when everything has settled
 * the rows show their new state (or their unchanged one, where a call failed)
 * and the mode hands the user back to the list.
 */
function useTaskSelection(ordered: Task[], selecting: boolean, onFinished?: () => void): TaskSelection {
  const { deleteTask, patchTask } = useTasks();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  const [busy, setBusy] = useState(false);

  // Leaving selection mode empties the pool: a selection the user cannot see is
  // one they would act on by accident the next time they come back.
  useEffect(() => {
    if (selecting) return;
    setSelectedIds((current) => (current.size === 0 ? current : new Set()));
    setMoving(false);
  }, [selecting]);

  const selected = ordered.filter((task) => selectedIds.has(task.id));

  /**
   * Runs one batch to completion, then returns the user to the list.
   *
   * `allSettled` rather than `all`: a batch is a set of independent writes, and
   * a user who asked for five deletions should not lose four of them because
   * the first one failed.
   */
  async function runBatch(calls: Promise<unknown>[]): Promise<void> {
    if (calls.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await Promise.allSettled(calls);
    } finally {
      setBusy(false);
      setMoving(false);
      setSelectedIds(new Set());
      onFinished?.();
    }
  }

  /**
   * Flips each pooled task to its other completion state, independently of the
   * rest of the pool. A mixed pool therefore inverts: the complete rows reopen
   * and the open ones close. Nothing is silently skipped, which is what the
   * earlier complete-only version did to a pooled task that was already done.
   */
  async function toggleSelectedCompletion(): Promise<void> {
    const now = new Date().toISOString();
    await runBatch(
      selected.map((task) => {
        const completed_at = task.completed_at === null ? now : null;
        return patchTask(task.id, { completed_at, updated_at: now }, { ...task, completed_at, updated_at: now });
      }),
    );
  }

  async function deleteSelected(): Promise<void> {
    const now = new Date().toISOString();
    await runBatch(
      selected.map((task) =>
        deleteTask(task.id, { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now }),
      ),
    );
  }

  async function moveSelected(listId: string): Promise<void> {
    const now = new Date().toISOString();
    await runBatch(
      selected.map((task) =>
        patchTask(task.id, { list_id: listId, updated_at: now }, { ...task, list_id: listId, updated_at: now }),
      ),
    );
  }

  function toggleSelected(id: string): void {
    if (busy) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  return {
    busy,
    deleteSelected,
    moveSelected,
    moving,
    selected,
    selectedIds,
    setMoving,
    toggleSelected,
    toggleSelectedCompletion,
  };
}

export { useTaskSelection };
