import type { ListRecord } from '../db/idb.types';
import { listServiceClient, resetListServiceClientForTest } from '../services/list-service-client';
import { HydrationExhaustedError } from '../sync/sync-client';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { ensureDefaultList } from './useLists.default-list';

// Split out of useLists.ts to satisfy the project's `max-lines: 150` ESLint
// rule. This file owns the hydrate/reload/subscribe machinery — pulling
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

async function notifyListSubscribers(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadListsSnapshot();

  if (options.broadcast ?? true) {
    channel.post();
  }
}

function resetListsSyncForTest(): void {
  channel.reset();
  resetSharedChannelsForTest();
  resetListServiceClientForTest();
  hydrated = false;
  snapshot = [];
  subscribers.clear();
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

export { getListsSnapshot, notifyListSubscribers, resetListsSyncForTest, subscribeToListChanges, subscribeToLists };
