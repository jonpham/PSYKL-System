import { generateKeyBetween } from 'fractional-indexing';
import { v7 as uuidv7 } from 'uuid';

import { openPsyklDb } from '../db/idb';
import type { ListRecord, SyncQueueEntry } from '../db/idb.types';

// Guards the default-list creation below against two tabs racing to create it
// twice: the check-and-create happens inside one IndexedDB transaction across
// `sync_meta` + `lists` + `sync_queue`, so a second tab's transaction always
// sees the flag a first tab already set (per UX.md § 10 decision 1).
const defaultListFlagKey = 'default_list_created';
const defaultListTitle = 'Tasks';

// A fixed, well-known id rather than uuidv7(): PSYKL is single-user,
// multi-device (docs/PRODUCT.md → Sync and Sharing Model), so there is only
// ever one default list per account. A random per-device id lets two
// devices that both bootstrap before either has synced create two distinct
// "Tasks" lists, silently splitting a task's list_id from the active
// device's local list id. A shared constant makes every device agree
// without a network round trip. list.service.ts's createList treats a
// duplicate-id create as an idempotent success for the same reason.
const DEFAULT_LIST_ID = '00000000-0000-7000-8000-000000000001';

// The earliest-position active list is the default list — either the one
// just created below, or (on later runs / other devices) the "Tasks" list
// created the first time. `useTasks` reads this to decide which list a
// pre-migration task (`list_id: null`) belongs to, per UX.md § 10 decision 1
// ("Migration puts every pre-existing task there").
let defaultListId: string | null = null;

function getDefaultListId(): string | null {
  return defaultListId;
}

function resetDefaultListForTest(): void {
  defaultListId = null;
}

/**
 * Creates the default "Tasks" list on first run, if no active list exists
 * yet, and records its id (or the pre-existing earliest list's id) as the
 * default. The check-and-create is one IndexedDB transaction across
 * `sync_meta`, `lists`, and `sync_queue` so it is race-safe across two tabs
 * opening the app for the first time simultaneously.
 */
async function ensureDefaultList(): Promise<void> {
  const db = await openPsyklDb();
  try {
    const tx = db.transaction(['sync_meta', 'lists', 'sync_queue'], 'readwrite');
    try {
      const metaStore = tx.objectStore('sync_meta');
      const flag = await metaStore.get(defaultListFlagKey);
      const listsStore = tx.objectStore('lists');
      const activeLists = (await listsStore.getAll()).filter((list) => list.deleted_at === null);

      if (!flag) {
        if (activeLists.length === 0) {
          const list = await createDefaultListRecord(listsStore, tx.objectStore('sync_queue'));
          activeLists.push(list);
        }
        await metaStore.put({ key: defaultListFlagKey, value: true });
      }

      defaultListId =
        activeLists.reduce<ListRecord | null>(
          (earliest, list) => (earliest === null || list.position < earliest.position ? list : earliest),
          null,
        )?.id ?? defaultListId;

      await tx.done;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        // The transaction may already be aborting after a failed request.
      }
      await tx.done.catch(() => undefined);
      throw error;
    }
  } finally {
    db.close();
  }
}

async function createDefaultListRecord(
  listsStore: { put: (value: ListRecord) => Promise<unknown> },
  syncQueueStore: { put: (value: SyncQueueEntry) => Promise<unknown> },
): Promise<ListRecord> {
  const now = new Date().toISOString();
  const list: ListRecord = {
    id: DEFAULT_LIST_ID,
    user_id: 'local',
    title: defaultListTitle,
    position: generateKeyBetween(null, null),
    created_at: now,
    updated_at: now,
    server_updated_at: now,
    deleted_at: null,
  };
  await listsStore.put(list);
  const entry: SyncQueueEntry = {
    id: uuidv7(),
    entity_type: 'list',
    entity_id: list.id,
    op: 'create',
    body: { id: list.id, title: list.title, position: list.position, updated_at: list.updated_at },
    idempotency_key: uuidv7(),
    attempts: 0,
    next_attempt_at: now,
    created_at: now,
  };
  await syncQueueStore.put(entry);
  return list;
}

export { DEFAULT_LIST_ID, ensureDefaultList, getDefaultListId, resetDefaultListForTest };
