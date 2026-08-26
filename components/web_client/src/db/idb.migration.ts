import type { IDBPTransaction, StoreNames } from 'idb';

import type { FailedOpEntry, PsyklDb, PsyklDbSchema, SyncQueueEntry, SyncQueueEntryV1 } from './idb.types';

export function migrateQueueEntryV1ToV2(entry: SyncQueueEntryV1): SyncQueueEntry {
  const { task_id: taskId, ...rest } = entry;
  return { ...rest, entity_type: 'task', entity_id: taskId };
}

function migrateFailedOpEntryV1ToV2(entry: SyncQueueEntryV1 & { failed_at: string; error: string }): FailedOpEntry {
  const { task_id: taskId, ...rest } = entry;
  return { ...rest, entity_type: 'task', entity_id: taskId } as FailedOpEntry;
}

async function rewriteStoreV1ToV2(
  store: any,
  migrateRow: (entry: any) => SyncQueueEntry | FailedOpEntry,
): Promise<void> {
  let cursor = await store.openCursor();
  while (cursor) {
    const value = cursor.value as unknown as SyncQueueEntryV1 & Record<string, unknown>;
    if ('task_id' in value) {
      await cursor.update(migrateRow(value) as never);
    }
    cursor = await cursor.continue();
  }
}

export async function upgradeV1ToV2(
  db: PsyklDb,
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): Promise<void> {
  // Migrate sync_queue and failed_ops stores
  for (const [storeName, migrateRow] of [
    ['sync_queue', migrateQueueEntryV1ToV2] as const,
    ['failed_ops', migrateFailedOpEntryV1ToV2] as const,
  ]) {
    const store = tx.objectStore(storeName);

    if ((store as any).indexNames.contains('task_id')) {
      (store as any).deleteIndex('task_id');
    }
    if (!store.indexNames.contains('entity_id')) {
      store.createIndex('entity_id', 'entity_id');
    }

    await rewriteStoreV1ToV2(store, migrateRow);
  }

  // Create the lists store
  if (!db.objectStoreNames.contains('lists')) {
    const lists = db.createObjectStore('lists', { keyPath: 'id' });
    lists.createIndex('deleted_at', 'deleted_at');
    lists.createIndex('position', 'position');
    lists.createIndex('updated_at', 'updated_at');
  }

  // Add list_id index to tasks
  const tasks = tx.objectStore('tasks');
  if (!tasks.indexNames.contains('list_id')) {
    tasks.createIndex('list_id', 'list_id');
  }
}
