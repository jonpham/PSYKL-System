import { useEffect, useSyncExternalStore } from 'react';

import { apiClient, type Task } from '../api/client';
import { listTasks, putTask } from '../db/idb';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { getActiveListId, registerActiveListChangeListener, resetActiveListForTest } from './useActiveList';
import { getDefaultListId } from './useLists.default-list';

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

// Re-filters tasks by the (possibly just-changed) active list without
// `useActiveList` importing this module back.
registerActiveListChangeListener(() => notifyTasksChanged({ broadcast: false }));

function useTasks(): TasksSnapshot {
  useEffect(() => {
    void hydrateTasks();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
    const { data, error, response } = await apiClient.GET('/tasks', {
      params: {
        header: {
          'X-User-Id': 'local',
        },
        query: {
          include_deleted: '1',
        },
      },
    });

    if (!response.ok || error) {
      throw new Error('Failed to hydrate tasks');
    }

    await Promise.all((data ?? []).map((task) => putTask(task)));
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
