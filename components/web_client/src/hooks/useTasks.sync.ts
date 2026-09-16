import type { Task } from '../api/client';
import { resetTaskServiceClientForTest, taskServiceClient } from '../services/task-service-client';
import { HydrationExhaustedError } from '../sync/sync-client';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { getActiveListId, registerActiveListChangeListener, resetActiveListForTest } from './useActiveList';
import { getDefaultListId } from './useLists.default-list';

// Split out of useTasks.ts to satisfy the project's `max-lines: 150` ESLint
// rule. This file owns the hydrate/reload/subscribe machinery — pulling
// server state into the local snapshot and notifying subscribers when it
// changes; useTasks.ts owns the mutating hook API.
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

export {
  getSnapshot,
  hydrateTasks,
  notifyTasksChanged,
  resetTasksSyncForTest,
  subscribeToTaskChanges,
  subscribeToTasks,
};
export type { TasksSnapshot };
