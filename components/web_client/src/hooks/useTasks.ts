import { useEffect, useSyncExternalStore } from 'react';

import { apiClient, type Task } from '../api/client';
import { listTasks, putTask } from '../db/idb';

interface TasksSnapshot {
  error: string | null;
  loading: boolean;
  tasks: Task[];
}

const channelName = 'psykl-idb';
const messageType = 'tasks-changed';
const subscribers = new Set<() => void>();

let broadcastChannel: BroadcastChannel | null = null;
let hydrationStarted = false;
let snapshot: TasksSnapshot = {
  error: null,
  loading: true,
  tasks: [],
};

function useTasks(): TasksSnapshot {
  useEffect(() => {
    void hydrateTasks();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

async function notifyTasksChanged(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadSnapshot({ error: null, loading: false });

  if (options.broadcast ?? true) {
    getBroadcastChannel()?.postMessage({ type: messageType });
  }
}

function resetUseTasksForTest(): void {
  broadcastChannel?.close();
  broadcastChannel = null;
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
  getBroadcastChannel();
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
      .filter((task) => task.deleted_at === null)
      .sort((left, right) => right.created_at.localeCompare(left.created_at)),
  };
  setSnapshot(nextSnapshot);

  return nextSnapshot;
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (broadcastChannel || typeof BroadcastChannel === 'undefined') {
    return broadcastChannel;
  }

  broadcastChannel = new BroadcastChannel(channelName);
  broadcastChannel.addEventListener('message', (event) => {
    if ((event.data as { type?: string }).type === messageType) {
      void notifyTasksChanged({ broadcast: false });
    }
  });

  return broadcastChannel;
}

function setSnapshot(nextSnapshot: TasksSnapshot): void {
  snapshot = nextSnapshot;
  subscribers.forEach((callback) => callback());
}

export { notifyTasksChanged, resetUseTasksForTest, useTasks };
