import { useEffect, useState } from 'react';

import type { Task } from '../../api/client';
import { useTasks } from '../../hooks/useTasks';

interface TaskSelection {
  completeSelected: () => Promise<void>;
  deleteSelected: () => Promise<void>;
  moveSelected: (listId: string) => Promise<void>;
  moving: boolean;
  /** The pooled tasks, in the order they appear on screen. */
  selected: Task[];
  setMoving: (moving: boolean) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
}

/**
 * The batch a user has pooled in selection mode, and the actions that apply to
 * it. Each action goes one task at a time through the same client paths a
 * single row uses, so every one inherits the offline queue and its recovery.
 */
function useTaskSelection(ordered: Task[], selecting: boolean): TaskSelection {
  const { deleteTask, patchTask } = useTasks();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);

  // Leaving selection mode empties the pool: a selection the user cannot see is
  // one they would act on by accident the next time they come back.
  useEffect(() => {
    if (selecting) return;
    setSelectedIds((current) => (current.size === 0 ? current : new Set()));
    setMoving(false);
  }, [selecting]);

  const selected = ordered.filter((task) => selectedIds.has(task.id));

  async function completeSelected(): Promise<void> {
    const now = new Date().toISOString();
    for (const task of selected.filter((entry) => entry.completed_at === null)) {
      await patchTask(task.id, { completed_at: now, updated_at: now }, { ...task, completed_at: now, updated_at: now });
    }
    setSelectedIds(new Set());
  }

  async function deleteSelected(): Promise<void> {
    const now = new Date().toISOString();
    for (const task of selected) {
      await deleteTask(task.id, { deleted_at: now, updated_at: now }, { ...task, deleted_at: now, updated_at: now });
    }
    setSelectedIds(new Set());
  }

  async function moveSelected(listId: string): Promise<void> {
    const now = new Date().toISOString();
    for (const task of selected) {
      await patchTask(task.id, { list_id: listId, updated_at: now }, { ...task, list_id: listId, updated_at: now });
    }
    setMoving(false);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  return {
    completeSelected,
    deleteSelected,
    moveSelected,
    moving,
    selected,
    selectedIds,
    setMoving,
    toggleSelected,
  };
}

export { useTaskSelection };
