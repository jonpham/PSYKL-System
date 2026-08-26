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

async function rewriteSyncQueueV1ToV2(
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): Promise<void> {
  const store = tx.objectStore('sync_queue');
  if ((store as unknown as IDBObjectStore).indexNames.contains('task_id')) {
    (store as unknown as IDBObjectStore).deleteIndex('task_id');
  }
  if (!store.indexNames.contains('entity_id')) {
    store.createIndex('entity_id', 'entity_id');
  }
  let cursor = await store.openCursor();
  while (cursor) {
    const value = cursor.value as unknown as SyncQueueEntryV1;
    if ('task_id' in value) {
      await cursor.update(migrateQueueEntryV1ToV2(value));
    }
    cursor = await cursor.continue();
  }
}

async function rewriteFailedOpsV1ToV2(
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): Promise<void> {
  const store = tx.objectStore('failed_ops');
  if ((store as unknown as IDBObjectStore).indexNames.contains('task_id')) {
    (store as unknown as IDBObjectStore).deleteIndex('task_id');
  }
  if (!store.indexNames.contains('entity_id')) {
    store.createIndex('entity_id', 'entity_id');
  }
  let cursor = await store.openCursor();
  while (cursor) {
    const value = cursor.value as unknown as SyncQueueEntryV1 & {
      failed_at: string;
      error: string;
    };
    if ('task_id' in value) {
      await cursor.update(migrateFailedOpEntryV1ToV2(value));
    }
    cursor = await cursor.continue();
  }
}

export async function upgradeV1ToV2(
  db: PsyklDb,
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): Promise<void> {
  try {
    await rewriteSyncQueueV1ToV2(tx);
    await rewriteFailedOpsV1ToV2(tx);

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
  } catch (error) {
    // Abort the transaction if migration fails, preventing partial/corrupted schema
    tx.abort();
    throw error;
  }
}
