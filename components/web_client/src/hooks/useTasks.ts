import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { taskServiceClient } from '../services/task-service-client';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { getActiveListId } from './useActiveList';
import { ensureDefaultList, getDefaultListId } from './useLists.default-list';
import {
  getSnapshot,
  hydrateTasks,
  notifyTasksChanged,
  resetTasksSyncForTest,
  subscribeToTaskChanges,
  subscribeToTasks,
  type TasksSnapshot,
} from './useTasks.sync';

interface UseTasksResult extends TasksSnapshot {
  createTask(title: string): Promise<Task>;
  deleteTask(id: string, body: TaskDeleteInput, optimistic: Task): Promise<void>;
  patchTask(id: string, body: TaskPatchInput, optimistic: Task): Promise<Task>;
}

function useTasks(): UseTasksResult {
  useEffect(() => {
    void hydrateTasks();
  }, []);
  const snapshot = useSyncExternalStore(subscribeToTasks, getSnapshot, getSnapshot);

  const createTask = useCallback(async (title: string): Promise<Task> => {
    const now = new Date().toISOString();
    const listId = await captureListId();
    const task: Task = {
      id: uuidv7(),
      user_id: 'local',
      title,
      created_at: now,
      completed_at: null,
      updated_at: now,
      server_updated_at: now,
      deleted_at: null,
      list_id: listId,
    };
    return mutateTask(() =>
      taskServiceClient.create(task.id, { id: task.id, list_id: listId, title, updated_at: now }, task),
    );
  }, []);

  const patchTask = useCallback(
    (id: string, body: TaskPatchInput, optimistic: Task) =>
      mutateTask(() => taskServiceClient.patch(id, body, optimistic)),
    [],
  );

  const deleteTask = useCallback(
    (id: string, body: TaskDeleteInput, optimistic: Task) =>
      mutateTask(() => taskServiceClient.delete(id, body, optimistic)),
    [],
  );

  return { ...snapshot, createTask, deleteTask, patchTask };
}

function mutateTask<T>(enqueue: () => Promise<T>): Promise<T> {
  // notify defaults to notifyTasksChanged inside enqueueWithReplay — no
  // override needed, unlike useLists.ts's mutateList.
  return enqueueWithReplay({ enqueue, replay });
}

function resetUseTasksForTest(): void {
  resetTasksSyncForTest();
}

/**
 * The list a task captured right now belongs to.
 *
 * The active list is chosen by an effect that waits for the lists to load, so a
 * user who types into a freshly opened app can beat it. A task written with no
 * list belongs to no list: it is filtered out of every list view on the next
 * load and reads, to the user, as a capture that was thrown away. Falling back
 * to the default list — creating it if this device has never had one —
 * guarantees every task has somewhere to be. `ensureDefaultList` is idempotent
 * and race-safe, so calling it here costs one IndexedDB read in the common case.
 */
async function captureListId(): Promise<string | null> {
  const activeListId = getActiveListId();
  if (activeListId !== null) {
    return activeListId;
  }
  await ensureDefaultList();
  return getDefaultListId();
}

export { notifyTasksChanged, resetUseTasksForTest, subscribeToTaskChanges, useTasks };
