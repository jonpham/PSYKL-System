import { useCallback, useEffect, useRef, useState } from 'react';

import type { Task } from '../api/client';
import { listDeletedRemote } from '../api/deleted.api-client';
import type { ListRecord } from '../db/idb.types';
import { listServiceClient } from '../services/list-service-client';
import { taskServiceClient } from '../services/task-service-client';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { notifyListSubscribers, subscribeToListChanges } from './useLists';
import { subscribeToTaskChanges } from './useTasks';

// 30-day Recently Deleted retention window — mirrors service-task's
// RECENTLY_DELETED_WINDOW_MS (duplicated per-file there too, across
// purge.service.ts / task.service.ts / list.service.ts; no shared export
// exists for it yet, so this is a third client-side copy of the same value).
const RECENTLY_DELETED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface DeletedItem {
  daysRemaining: number;
  deletedAt: string;
  id: string;
  title: string;
  type: 'list' | 'task';
}

interface UseRecentlyDeletedResult {
  items: DeletedItem[];
  restore(item: DeletedItem): Promise<void>;
}

function useRecentlyDeleted(): UseRecentlyDeletedResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<ListRecord[]>([]);
  // Guards against out-of-order concurrent reload() calls: restore()'s own
  // enqueueWithReplay fires a notify() (triggering a reload() via
  // subscribeToTaskChanges below) BEFORE restore()'s own explicit
  // `await reload()` runs — every restore() therefore has at least two
  // reload() calls in flight, with no guarantee the one that started first
  // resolves first. Without this guard, an earlier call reading a stale
  // "still deleted" snapshot can resolve after a newer call and overwrite
  // its already-correct state (observed as flaky item disappear/reappear in
  // RecentlyDeleted.stories.tsx's restore flow, more often under CI's
  // slower/more contended runner).
  const reloadGeneration = useRef(0);

  const reload = useCallback(async () => {
    const generation = ++reloadGeneration.current;
    // list() already includes every row this device has ever seen, deleted
    // or not — no separate "local" primitive needed. Rows tombstoned on
    // another device and never synced here are merged in from GET /deleted
    // purely in memory below; nothing is written to IDB until the user
    // restores one (restore()'s existing optimistic write persists it then,
    // same as any other restore).
    const [localTasks, localLists, remoteDeleted] = await Promise.all([
      taskServiceClient.list().catch(() => [] as Task[]),
      listServiceClient.list().catch(() => [] as ListRecord[]),
      listDeletedRemote()
        .then((result) => result.data ?? null)
        .catch(() => null),
    ]);
    if (generation !== reloadGeneration.current) {
      // A newer reload() has since started; this result is stale — discard.
      return;
    }
    setTasks(mergeById(localTasks, remoteDeleted?.tasks ?? []));
    setLists(mergeById(localLists, remoteDeleted?.lists ?? []));
  }, []);

  useEffect(() => {
    void reload();
    // Live-updates while the screen stays open: a delete/restore happening
    // anywhere else in the app (e.g. TaskList) while Recently Deleted is
    // mounted must show up without the user closing and reopening it.
    const unsubscribeTasks = subscribeToTaskChanges(() => void reload());
    const unsubscribeLists = subscribeToListChanges(() => void reload());
    return () => {
      // Bumping the generation also invalidates any reload() still in flight,
      // so it cannot write state after unmount. In a browser that write is
      // merely wasted; under test jsdom's globals are already gone and it
      // throws "window is not defined" (see Root.unit.test.tsx).
      reloadGeneration.current += 1;
      unsubscribeTasks();
      unsubscribeLists();
    };
  }, [reload]);

  const restore = useCallback(
    async (item: DeletedItem): Promise<void> => {
      const now = new Date().toISOString();
      if (item.type === 'task') {
        const existing = tasks.find((task) => task.id === item.id);
        if (!existing) {
          return;
        }
        const optimistic = { ...existing, deleted_at: null, updated_at: now };
        // enqueueWithReplay (not a bare service-client call): matches
        // useTasks.ts's mutateTask — without it, the restore op never
        // triggers replay(), and useTasks()'s own subscribers (TaskList)
        // never learn the row came back.
        await enqueueWithReplay({
          enqueue: () => taskServiceClient.restore(item.id, { updated_at: now }, optimistic),
          replay,
        });
      } else {
        const existing = lists.find((list) => list.id === item.id);
        if (!existing) {
          return;
        }
        const optimistic = { ...existing, deleted_at: null, updated_at: now };
        await enqueueWithReplay({
          enqueue: () => listServiceClient.restore(item.id, { updated_at: now }, optimistic),
          notify: notifyListSubscribers,
          replay,
        });
      }
      await reload();
    },
    [tasks, lists, reload],
  );

  return { items: toDeletedItems(tasks, lists), restore };
}

function mergeById<T extends { id: string }>(local: T[], remoteOnly: T[]): T[] {
  const byId = new Map(local.map((row) => [row.id, row]));
  for (const row of remoteOnly) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

function toDeletedItems(tasks: Task[], lists: ListRecord[]): DeletedItem[] {
  const now = Date.now();
  const taskItems = tasks
    .filter((task) => task.deleted_at !== null && withinWindow(task.deleted_at, now))
    .map((task) => toItem(task.id, 'task', task.title, task.deleted_at as string, now));
  const listItems = lists
    .filter((list) => list.deleted_at !== null && withinWindow(list.deleted_at, now))
    .map((list) => toItem(list.id, 'list', list.title, list.deleted_at as string, now));
  return [...taskItems, ...listItems].sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
}

function withinWindow(deletedAt: string, now: number): boolean {
  return now - new Date(deletedAt).getTime() < RECENTLY_DELETED_WINDOW_MS;
}

function toItem(id: string, type: 'list' | 'task', title: string, deletedAt: string, now: number): DeletedItem {
  const elapsedMs = now - new Date(deletedAt).getTime();
  const daysRemaining = Math.max(0, Math.ceil((RECENTLY_DELETED_WINDOW_MS - elapsedMs) / MS_PER_DAY));
  return { daysRemaining, deletedAt, id, title, type };
}

export { useRecentlyDeleted };
export type { DeletedItem };
