import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { listTasks } from '../db/idb';
import { taskServiceClient } from '../services/task-service-client';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { getActiveListId, registerActiveListChangeListener, resetActiveListForTest } from './useActiveList';
import { getDefaultListId } from './useLists.default-list';

interface TasksSnapshot {
  error: string | null;
  loading: boolean;
  tasks: Task[];
}

interface UseTasksResult extends TasksSnapshot {
  createTask(title: string): Promise<Task>;
  deleteTask(id: string, body: TaskDeleteInput, optimistic: Task): Promise<void>;
  patchTask(id: string, body: TaskPatchInput, optimistic: Task): Promise<Task>;
}

const subscribers = new Set<() => void>();
const channel = createChannelNotifier('psykl-idb', 'tasks-changed', () => {
  void notifyTasksChanged({ broadcast: false });
});

let hydrationStarted = false;
let snapshot: TasksSnapshot = {
  error: null,
  loading: true,
  tasks: [],
};

// Re-filters tasks by the (possibly just-changed) active list without
// `useActiveList` importing this module back.
registerActiveListChangeListener(() => notifyTasksChanged({ broadcast: false }));

function useTasks(): UseTasksResult {
  useEffect(() => {
    void hydrateTasks();
  }, []);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const createTask = useCallback(async (title: string): Promise<Task> => {
    const now = new Date().toISOString();
    const listId = getActiveListId();
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

async function notifyTasksChanged(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadSnapshot({ error: null, loading: false });

  if (options.broadcast ?? true) {
    channel.post();
  }
}

function resetUseTasksForTest(): void {
  channel.reset();
  resetActiveListForTest();
  resetSharedChannelsForTest();
  hydrationStarted = false;
  snapshot = {
    error: null,
    loading: true,
    tasks: [],
  };
  subscribers.clear();
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  channel.ensureChannel();
  void reloadSnapshot({ loading: false });

  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): TasksSnapshot {
  return snapshot;
}

async function hydrateTasks(): Promise<void> {
  if (hydrationStarted) {
    return;
  }

  hydrationStarted = true;
  setSnapshot({ ...snapshot, loading: true });

  try {
    await taskServiceClient.hydrate();
    await reloadSnapshot({ error: null, loading: false });
  } catch {
    const localSnapshot = await reloadSnapshot({ error: null, loading: false });
    if (localSnapshot.tasks.length === 0) {
      setSnapshot({ ...localSnapshot, error: 'Failed to load tasks' });
    }
  }
}

async function reloadSnapshot(
  overrides: Partial<Pick<TasksSnapshot, 'error' | 'loading'>> = {},
): Promise<TasksSnapshot> {
  const tasks = await listTasks();
  const nextSnapshot = {
    error: overrides.error ?? snapshot.error,
    loading: overrides.loading ?? snapshot.loading,
    tasks: tasks
      .filter((task) => task.deleted_at === null && isInActiveList(task))
      .sort((left, right) => right.created_at.localeCompare(left.created_at)),
  };
  setSnapshot(nextSnapshot);

  return nextSnapshot;
}

/**
 * A task belongs to the active list either by an exact `list_id` match, or
 * (for tasks predating lists, `list_id: null`) by the active list being the
 * default "Tasks" list — per UX.md § 10 decision 1, "Migration puts every
 * pre-existing task there."
 */
function isInActiveList(task: Task): boolean {
  const activeListId = getActiveListId();
  if (activeListId === null || task.list_id === activeListId) {
    return true;
  }
  return task.list_id === null && activeListId === getDefaultListId();
}

function setSnapshot(nextSnapshot: TasksSnapshot): void {
  snapshot = nextSnapshot;
  subscribers.forEach((callback) => callback());
}

export { notifyTasksChanged, resetUseTasksForTest, useTasks };
