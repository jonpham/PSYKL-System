/* eslint-disable max-lines */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { createTaskServiceClient, resetTaskServiceClientForTest } from '../services/task-service-client';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { HydrationExhaustedError } from '../sync/sync-client';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { getActiveListId, registerActiveListChangeListener, resetActiveListForTest } from './useActiveList';
import { ensureDefaultList, getDefaultListId } from './useLists.default-list';
import type { UseTasksResult } from './useTasks';

// Decision 6 exception (Spec 1 decision S1-1): this module's snapshot store
// runs outside React — page sync triggers and the BroadcastChannel reload it —
// so it cannot read the injected shim. It is sync-path only, so it builds the
// offline-capable shim itself and can never reach the API path by mistake.
// Retired with the store in Spec 5 (Decisions 8-9).
const taskServiceClient = createTaskServiceClient(true);

// The sync path for Tasks (Offline Mode on): the hook API plus the
// hydrate/reload/subscribe machinery that pulls server state into the local
// snapshot and notifies subscribers when it changes. useTasks.ts is only the
// seam choosing between this and useTasks.api.ts.
interface TasksSnapshot {
  error: string | null;
  loading: boolean;
  tasks: Task[];
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
// Guards against out-of-order concurrent reloadSnapshot() calls:
// enqueueWithReplay (sync/page-triggers.ts) fires notify() (which defaults
// to notifyTasksChanged) twice per mutation — once immediately after
// enqueue, again after the fire-and-forget replay() settles — with no
// ordering guarantee between the two, or against any other in-flight
// notify (e.g. useRecentlyDeleted.ts's restore()). An earlier call's
// result can otherwise resolve after a newer one and overwrite this
// module-level singleton with stale data.
let reloadGeneration = 0;

// Re-filters tasks by the (possibly just-changed) active list without
// `useActiveList` importing this module back.
registerActiveListChangeListener(() => notifyTasksChanged({ broadcast: false }));

async function notifyTasksChanged(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadSnapshot({ error: null, loading: false });

  if (options.broadcast ?? true) {
    channel.post();
  }
}

function resetTasksSyncForTest(): void {
  channel.reset();
  resetActiveListForTest();
  resetSharedChannelsForTest();
  resetTaskServiceClientForTest();
  hydrationStarted = false;
  snapshot = {
    error: null,
    loading: true,
    tasks: [],
  };
  subscribers.clear();
}

function subscribeToTasks(callback: () => void): () => void {
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
  await reloadSnapshot({ error: null, loading: false });
}

async function reloadSnapshot(
  overrides: Partial<Pick<TasksSnapshot, 'error' | 'loading'>> = {},
): Promise<TasksSnapshot> {
  const generation = ++reloadGeneration;
  try {
    const tasks = await taskServiceClient.list();
    if (generation !== reloadGeneration) {
      // A newer reloadSnapshot() has since started; this result is stale.
      return snapshot;
    }
    const nextSnapshot: TasksSnapshot = {
      error: overrides.error ?? snapshot.error,
      loading: overrides.loading ?? snapshot.loading,
      tasks: tasks
        .filter((task) => task.deleted_at === null && isInActiveList(task))
        .sort((left, right) => right.created_at.localeCompare(left.created_at)),
    };
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  } catch (error) {
    if (!(error instanceof HydrationExhaustedError)) {
      throw error;
    }
    if (generation !== reloadGeneration) {
      return snapshot;
    }
    const nextSnapshot: TasksSnapshot = {
      error: 'Failed to load tasks',
      loading: overrides.loading ?? snapshot.loading,
      tasks: [],
    };
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }
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

/**
 * Lets a module outside this hook (currently `useRecentlyDeleted.ts`) react
 * to same-tab Task changes — mirrors `useLists.sync.ts`'s `subscribeToListChanges`.
 */
function subscribeToTaskChanges(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function useTasksSyncClient(): UseTasksResult {
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
  // override needed, unlike useLists.sync.ts's mutateList.
  return enqueueWithReplay({ enqueue, replay });
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

function resetUseTasksForTest(): void {
  resetTasksSyncForTest();
}

export {
  getSnapshot,
  hydrateTasks,
  notifyTasksChanged,
  resetTasksSyncForTest, // test-use-only
  resetUseTasksForTest, // test-use-only
  subscribeToTaskChanges,
  subscribeToTasks,
  useTasksSyncClient,
};
export type { TasksSnapshot };
