import type { IDBPTransaction, StoreNames } from 'idb';

import type { PsyklDb, PsyklDbSchema, SyncQueueEntry, SyncQueueEntryV1 } from './idb.types';

export function migrateQueueEntryV1ToV2(entry: SyncQueueEntryV1): SyncQueueEntry {
  const { task_id: taskId, ...rest } = entry;
  return { ...rest, entity_type: 'task', entity_id: taskId };
}

export function upgradeV1ToV2(
  db: PsyklDb,
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): void {
  for (const storeName of ['sync_queue', 'failed_ops'] as const) {
    const store = tx.objectStore(storeName);

    if ((store as any).indexNames.contains('task_id')) {
      (store as any).deleteIndex('task_id');
    }
    if (!store.indexNames.contains('entity_id')) {
      store.createIndex('entity_id', 'entity_id');
    }
    void store.openCursor().then(async function rewrite(cursor): Promise<void> {
      if (!cursor) {
        return;
      }
      const value = cursor.value as unknown as SyncQueueEntryV1;
      if ('task_id' in value) {
        await cursor.update(migrateQueueEntryV1ToV2(value) as never);
      }
      const next = await cursor.continue();
      return rewrite(next);
    });
  }

  if (!db.objectStoreNames.contains('lists')) {
    const lists = db.createObjectStore('lists', { keyPath: 'id' });
    lists.createIndex('deleted_at', 'deleted_at');
    lists.createIndex('position', 'position');
    lists.createIndex('updated_at', 'updated_at');
  }

  const tasks = tx.objectStore('tasks');
  if (!tasks.indexNames.contains('list_id')) {
    tasks.createIndex('list_id', 'list_id');
  }
}
