/* eslint-disable max-lines */
import { useCallback, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { ListRecord } from '../db/idb.types';
import { createListServiceClient, resetListServiceClientForTest } from '../services/list-service-client';
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import { HydrationExhaustedError } from '../sync/sync-client';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import type { UseListsResult } from './useLists';
import { ensureDefaultList, resetDefaultListForTest } from './useLists.default-list';
import { nextListPosition, positionBetween } from './useLists.positions';

// Decision 6 exception (Spec 1 decision S1-1): this module's snapshot store
// runs outside React — page sync triggers and the BroadcastChannel reload it —
// so it cannot read the injected shim. It is sync-path only, so it builds the
// offline-capable shim itself and can never reach the API path by mistake.
// Retired with the store in Spec 5 (Decisions 8-9).
const listServiceClient = createListServiceClient(true);

// This file owns the hydrate/reload/subscribe machinery — pulling
// server state into the local snapshot and notifying subscribers when it
// changes; useLists.ts owns the mutating hook API.
const subscribers = new Set<() => void>();
const channel = createChannelNotifier('psykl-idb', 'lists-changed', () => {
  void notifyListSubscribers({ broadcast: false });
});

let hydrated = false;
let snapshot: ListRecord[] = [];
// Guards against out-of-order concurrent reloadListsSnapshot() calls — same
// race as useTasks.sync.ts's reloadSnapshot(): enqueueWithReplay fires
// notify() twice per mutation with no ordering guarantee between them.
let reloadGeneration = 0;

function useListsSyncClient(): UseListsResult {
  const lists = useSyncExternalStore(subscribeToLists, getListsSnapshot);

  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      // The default list is established first, whatever order the user and the
      // bootstrap arrive in: a user who opens the Lists page and adds a list
      // straight away used to write their list first, which made the bootstrap
      // believe this device already had a default list and skip creating one.
      await ensureDefaultList();
      const now = new Date().toISOString();
      const list: ListRecord = {
        id: uuidv7(),
        user_id: 'local',
        title,
        position: await nextListPosition(),
        created_at: now,
        updated_at: now,
        server_updated_at: now,
        deleted_at: null,
      };
      return mutateList(() =>
        listServiceClient.create(
          list.id,
          { id: list.id, title: list.title, position: list.position, updated_at: list.updated_at },
          list,
        ),
      );
    },
    [lists],
  );

  const deleteList = useCallback(
    async (id: string, deletedAt?: string): Promise<void> => {
      // The last remaining list can never be deleted (UX.md § 10 decision 1).
      if (lists.length <= 1) {
        return;
      }
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      // A caller deleting the list's tasks alongside it passes their shared
      // timestamp, which is what pairs them in Recently Deleted (useListDeletion).
      const deleted_at = deletedAt ?? new Date().toISOString();
      const optimistic: ListRecord = { ...existing, deleted_at, updated_at: deleted_at };
      await mutateList(() => listServiceClient.delete(id, { deleted_at }, optimistic));
    },
    [lists],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      const updated_at = new Date().toISOString();
      const { position, respaced } = await positionBetween(before, after);
      for (const list of respaced) {
        if (list.id === id) {
          continue;
        }
        await mutateList(() =>
          listServiceClient.patch(list.id, { position: list.position, updated_at }, { ...list, updated_at }),
        );
      }
      const optimistic: ListRecord = { ...existing, position, updated_at };
      await mutateList(() => listServiceClient.patch(id, { position, updated_at }, optimistic));
    },
    [lists],
  );

  const renameList = useCallback(
    async (id: string, title: string): Promise<void> => {
      const updated_at = new Date().toISOString();
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      const optimistic: ListRecord = { ...existing, title, updated_at };
      await mutateList(() => listServiceClient.patch(id, { title, updated_at }, optimistic));
    },
    [lists],
  );

  return { canDelete: lists.length > 1, createList, deleteList, lists, moveList, renameList };
}

function mutateList<T>(enqueue: () => Promise<T>): Promise<T> {
  return enqueueWithReplay({ enqueue, notify: notifyListSubscribers, replay });
}

async function hydrateThenEnsureDefaultList(): Promise<void> {
  // Pull server-known lists down first (best-effort — offline is expected
  // and not an error here, matching useTasks.ts's hydrateTasks). Only after
  // that does ensureDefaultList() decide, from local IDB state, whether this
  // device still needs to bootstrap the default list itself.
  try {
    await listServiceClient.list();
  } catch {
    // Offline on first load — ensureDefaultList() below still makes the app
    // usable; the next successful list() call catches this device up.
  }
  await ensureDefaultList();
  await reloadListsSnapshot();
}

async function notifyListSubscribers(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadListsSnapshot();

  if (options.broadcast ?? true) {
    channel.post();
  }
}

function subscribeToLists(callback: () => void): () => void {
  subscribers.add(callback);
  channel.ensureChannel();
  if (!hydrated) {
    void hydrateThenEnsureDefaultList();
  }

  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Lets a module outside this hook (currently `useRecentlyDeleted.ts`) react
 * to same-tab List changes — mirrors `useTasks.ts`'s `subscribeToTaskChanges`.
 */
function subscribeToListChanges(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getListsSnapshot(): ListRecord[] {
  return snapshot;
}

async function reloadListsSnapshot(): Promise<ListRecord[]> {
  const generation = ++reloadGeneration;
  try {
    const lists = await listServiceClient.list();
    hydrated = true;
    if (generation !== reloadGeneration) {
      // A newer reloadListsSnapshot() has since started; this result is stale.
      return snapshot;
    }
    setSnapshot(lists.filter((list) => list.deleted_at === null));
  } catch (error) {
    if (!(error instanceof HydrationExhaustedError)) {
      throw error;
    }
    // Unreachable in production: ensureDefaultList() always runs before
    // this is called from hydrateThenEnsureDefaultList(), guaranteeing at
    // least one local List exists by the time this executes. Kept for
    // type-safety symmetry with useTasks.ts's reloadSnapshot().
    hydrated = true;
    if (generation !== reloadGeneration) {
      return snapshot;
    }
    setSnapshot([]);
  }
  return snapshot;
}

function setSnapshot(nextSnapshot: ListRecord[]): void {
  snapshot = nextSnapshot;
  subscribers.forEach((callback) => callback());
}

function resetListsSyncForTest(): void {
  channel.reset();
  resetSharedChannelsForTest();
  resetListServiceClientForTest();
  hydrated = false;
  snapshot = [];
  subscribers.clear();
}

function resetUseListsForTest(): void {
  resetDefaultListForTest();
  resetListsSyncForTest();
}

export {
  getListsSnapshot,
  notifyListSubscribers,
  resetListsSyncForTest, // test-use-only
  resetUseListsForTest, // test-use-only
  subscribeToListChanges,
  subscribeToLists,
  useListsSyncClient,
};
