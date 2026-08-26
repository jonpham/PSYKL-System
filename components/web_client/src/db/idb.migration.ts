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

async function rewriteSyncQueueV1ToV2(store: IDBObjectStore): Promise<void> {
  let cursor = await (store as any).openCursor();
  while (cursor) {
    const value = cursor.value as unknown as SyncQueueEntryV1;
    if ('task_id' in value) {
      const migrated = migrateQueueEntryV1ToV2(value);
      await cursor.update(migrated);
    }
    cursor = await cursor.continue();
  }
}

async function rewriteFailedOpsV1ToV2(store: IDBObjectStore): Promise<void> {
  let cursor = await (store as any).openCursor();
  while (cursor) {
    const value = cursor.value as unknown as SyncQueueEntryV1 & {
      failed_at: string;
      error: string;
    };
    if ('task_id' in value) {
      const migrated = migrateFailedOpEntryV1ToV2(value);
      await cursor.update(migrated);
    }
    cursor = await cursor.continue();
  }
}

export async function upgradeV1ToV2(
  db: PsyklDb,
  tx: IDBPTransaction<PsyklDbSchema, ArrayLike<StoreNames<PsyklDbSchema>>, 'versionchange'>,
): Promise<void> {
  try {
    // Migrate sync_queue store
    const syncQueueStore = tx.objectStore('sync_queue');
    if ((syncQueueStore as any).indexNames.contains('task_id')) {
      (syncQueueStore as any).deleteIndex('task_id');
    }
    if (!syncQueueStore.indexNames.contains('entity_id')) {
      syncQueueStore.createIndex('entity_id', 'entity_id');
    }
    await rewriteSyncQueueV1ToV2(syncQueueStore as unknown as IDBObjectStore);

    // Migrate failed_ops store
    const failedOpsStore = tx.objectStore('failed_ops');
    if ((failedOpsStore as any).indexNames.contains('task_id')) {
      (failedOpsStore as any).deleteIndex('task_id');
    }
    if (!failedOpsStore.indexNames.contains('entity_id')) {
      failedOpsStore.createIndex('entity_id', 'entity_id');
    }
    await rewriteFailedOpsV1ToV2(failedOpsStore as unknown as IDBObjectStore);

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
