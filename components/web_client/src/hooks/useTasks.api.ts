import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { DEFAULT_LIST_ID } from '../services/default-list';
import { TASKS_QUERY_KEY } from './query-keys';
import { getActiveListId, useActiveListId } from './useActiveList';
import { useServiceClients } from './useServiceClients';
import type { UseTasksResult } from './useTasks';

const NO_TASKS: Task[] = [];

/**
 * The online-only path for Tasks (Offline Mode off). Mirrors the sync path's
 * view — open tasks of the active list, newest first, list-less tasks under
 * Tasks — but reads the server through TanStack Query, and every write waits for
 * the server before it shows (Spec 3 decision S3-2). A capture with no list
 * chosen lands in Tasks by its fixed id (S3-4); this path never bootstraps a
 * default list, because the server keeps one (Decision 15).
 */
function useTasksApiClient(): UseTasksResult {
  const { tasks: taskServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const activeListId = useActiveListId();
  const query = useQuery({ queryFn: () => taskServiceClient.list(), queryKey: TASKS_QUERY_KEY });

  const tasks = useMemo(
    () =>
      (query.data ?? NO_TASKS)
        .filter((task) => task.deleted_at === null && isInList(task, activeListId))
        .sort((left, right) => right.created_at.localeCompare(left.created_at)),
    [activeListId, query.data],
  );

  const store = useCallback(
    (saved: Task) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) => [
        ...current.filter((task) => task.id !== saved.id),
        saved,
      ]);
    },
    [queryClient],
  );

  const createTask = useCallback(
    async (title: string): Promise<Task> => {
      const id = uuidv7();
      const now = new Date().toISOString();
      // Read once, now: the list the user was looking at when they typed.
      const list_id = getActiveListId() ?? DEFAULT_LIST_ID;
      const optimistic: Task = {
        completed_at: null,
        created_at: now,
        deleted_at: null,
        id,
        list_id,
        server_updated_at: now,
        title,
        updated_at: now,
        user_id: 'local',
      };
      const saved = await taskServiceClient.create(id, { id, list_id, title, updated_at: now }, optimistic);
      store(saved);
      return saved;
    },
    [store, taskServiceClient],
  );

  const patchTask = useCallback(
    async (id: string, body: TaskPatchInput, optimistic: Task): Promise<Task> => {
      const saved = await taskServiceClient.patch(id, body, optimistic);
      store(saved);
      return saved;
    },
    [store, taskServiceClient],
  );

  const deleteTask = useCallback(
    async (id: string, body: TaskDeleteInput, optimistic: Task): Promise<void> => {
      await taskServiceClient.delete(id, body, optimistic);
      store({ ...optimistic, deleted_at: body.deleted_at, updated_at: body.updated_at });
    },
    [store, taskServiceClient],
  );

  return {
    createTask,
    deleteTask,
    error: query.isError ? 'Failed to load tasks' : null,
    loading: query.isPending && !query.isError,
    patchTask,
    tasks,
  };
}

/** Same rule as the sync path's `isInActiveList`, with the default list known
 * by its fixed id rather than read from IndexedDB. */
function isInList(task: Task, activeListId: string | null): boolean {
  if (activeListId === null || task.list_id === activeListId) {
    return true;
  }
  return task.list_id === null && activeListId === DEFAULT_LIST_ID;
}

export { useTasksApiClient };
