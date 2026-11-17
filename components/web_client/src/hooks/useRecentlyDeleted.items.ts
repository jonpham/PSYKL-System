import type { Task } from '../api/client';
import type { ListRecord } from '../db/idb.types';

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
  /** Lists only: tasks tombstoned in the same action, which restore with it. */
  itemCount?: number;
  title: string;
  type: 'list' | 'task';
}

function toDeletedItems(tasks: Task[], lists: ListRecord[]): DeletedItem[] {
  const now = Date.now();
  const taskItems = tasks
    .filter((task) => task.deleted_at !== null && withinWindow(task.deleted_at, now))
    .map((task) => toItem(task.id, 'task', task.title, task.deleted_at as string, now));
  const listItems = lists
    .filter((list) => list.deleted_at !== null && withinWindow(list.deleted_at, now))
    .map((list) => ({
      ...toItem(list.id, 'list', list.title, list.deleted_at as string, now),
      itemCount: cascadedWith(list, tasks).length,
    }));
  return [...taskItems, ...listItems].sort((left, right) => right.deletedAt.localeCompare(left.deletedAt));
}

/**
 * The tasks a list was deleted with: same list, same `deleted_at`.
 *
 * `useListDeletion` issues one timestamp for the whole cascade, so the pair is
 * derivable without a column of its own. A task deleted on its own at another
 * moment keeps its own deletion, even when its list is gone too.
 */
function cascadedWith(list: ListRecord, tasks: Task[]): Task[] {
  return tasks.filter((task) => task.list_id === list.id && task.deleted_at === list.deleted_at);
}

function withinWindow(deletedAt: string, now: number): boolean {
  return now - new Date(deletedAt).getTime() < RECENTLY_DELETED_WINDOW_MS;
}

function toItem(id: string, type: 'list' | 'task', title: string, deletedAt: string, now: number): DeletedItem {
  const elapsedMs = now - new Date(deletedAt).getTime();
  const daysRemaining = Math.max(0, Math.ceil((RECENTLY_DELETED_WINDOW_MS - elapsedMs) / MS_PER_DAY));
  return { daysRemaining, deletedAt, id, title, type };
}

export { cascadedWith, toDeletedItems };
export type { DeletedItem };
