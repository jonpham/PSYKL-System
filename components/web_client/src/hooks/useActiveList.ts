import { useSyncExternalStore } from 'react';

import { getMeta, putMeta } from '../db/idb';

// The active list id is device-local, not synced — same `sync_meta` store the
// theme preference will use in a later Spec (per UX.md § 10 decision 1 /
// DevTask 6 interfaces note). It scopes which tasks `useTasks` shows and
// which list new tasks are stamped with on create. `useTasks` registers a
// listener below so changing the active list re-filters tasks without this
// module importing `useTasks` back (which would be circular).
const activeListMetaKey = 'active_list_id';
const activeListSubscribers = new Set<() => void>();

let activeListId: string | null = null;
let activeListHydrated = false;
let onActiveListChanged: (() => Promise<void>) | null = null;

function registerActiveListChangeListener(listener: () => Promise<void>): void {
  onActiveListChanged = listener;
}

function useActiveListId(): string | null {
  return useSyncExternalStore(subscribeActiveList, getActiveListIdSnapshot);
}

/** Synchronous accessor for callers (e.g. `TaskCreateForm`) that need the
 * current active list id without subscribing to it, to stamp `list_id` on a
 * newly created task. */
function getActiveListId(): string | null {
  return activeListId;
}

async function setActiveListId(id: string): Promise<void> {
  activeListHydrated = true;
  activeListId = id;
  await putMeta({ key: activeListMetaKey, value: id });
  notifyActiveListSubscribers();
  await onActiveListChanged?.();
}

function resetActiveListForTest(): void {
  activeListHydrated = false;
  activeListId = null;
  activeListSubscribers.clear();
}

function subscribeActiveList(callback: () => void): () => void {
  activeListSubscribers.add(callback);
  if (!activeListHydrated) {
    void hydrateActiveListId();
  }

  return () => {
    activeListSubscribers.delete(callback);
  };
}

async function hydrateActiveListId(): Promise<void> {
  if (activeListHydrated) {
    return;
  }
  activeListHydrated = true;

  const meta = await getMeta(activeListMetaKey);
  if (typeof meta?.value === 'string') {
    activeListId = meta.value;
    notifyActiveListSubscribers();
    await onActiveListChanged?.();
  }
}

function notifyActiveListSubscribers(): void {
  activeListSubscribers.forEach((callback) => callback());
}

function getActiveListIdSnapshot(): string | null {
  return activeListId;
}

export { getActiveListId, registerActiveListChangeListener, resetActiveListForTest, setActiveListId, useActiveListId };
