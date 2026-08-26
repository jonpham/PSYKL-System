import { openDB } from 'idb';

import type { Task } from '../api/client';
import { migrateQueueEntryV1ToV2, upgradeV1ToV2 } from './idb.migration';
import type { FailedOpEntry, PsyklDb, PsyklDbSchema, SyncMetaEntry, SyncQueueEntry } from './idb.types';

const databaseName = 'psykl';
export const CURRENT_SCHEMA_VERSION = 2;
export { migrateQueueEntryV1ToV2 };

async function openPsyklDb(): Promise<PsyklDb> {
  return openDB<PsyklDbSchema>(databaseName, CURRENT_SCHEMA_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        createV1Stores(db);
      }
      if (oldVersion < 2) {
        void upgradeV1ToV2(db, tx);
      }
    },
  });
}

async function putTask(task: Task, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('tasks', task);
  });
}

async function listTasks(db?: PsyklDb): Promise<Task[]> {
  return withDb(db, async (database) => database.getAll('tasks'));
}

async function getTask(id: string, db?: PsyklDb): Promise<Task | undefined> {
  return withDb(db, async (database) => database.get('tasks', id));
}

async function deleteTask(id: string, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.delete('tasks', id);
  });
}

async function enqueueSyncOp(entry: SyncQueueEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('sync_queue', entry);
  });
}

async function putTaskAndEnqueueSyncOp(task: Task, entry: SyncQueueEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    const transaction = database.transaction(['tasks', 'sync_queue'], 'readwrite');
    try {
      await transaction.objectStore('tasks').put(task);
      await transaction.objectStore('sync_queue').put(entry);
      await transaction.done;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already be aborting after a failed request.
      }
      await transaction.done.catch(() => undefined);
      throw error;
    }
  });
}

async function deleteSyncOp(id: string, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.delete('sync_queue', id);
  });
}

async function listSyncQueue(db?: PsyklDb): Promise<SyncQueueEntry[]> {
  return withDb(db, async (database) => database.getAllFromIndex('sync_queue', 'created_at'));
}

async function putFailedOp(entry: FailedOpEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('failed_ops', entry);
  });
}

async function deleteFailedOp(id: string, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.delete('failed_ops', id);
  });
}

async function listFailedOps(db?: PsyklDb): Promise<FailedOpEntry[]> {
  return withDb(db, async (database) => database.getAllFromIndex('failed_ops', 'created_at'));
}

async function putMeta(entry: SyncMetaEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('sync_meta', entry);
  });
}

async function deleteMeta(key: string, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.delete('sync_meta', key);
  });
}

async function getMeta(key: string, db?: PsyklDb): Promise<SyncMetaEntry | undefined> {
  return withDb(db, async (database) => database.get('sync_meta', key));
}

function createV1Stores(db: PsyklDb): void {
  const failedOps = db.createObjectStore('failed_ops', { keyPath: 'id' });
  failedOps.createIndex('created_at', 'created_at');
  (failedOps as unknown as IDBObjectStore).createIndex('task_id', 'task_id');
  db.createObjectStore('sync_meta', { keyPath: 'key' });
  const syncQueue = db.createObjectStore('sync_queue', { keyPath: 'id' });
  syncQueue.createIndex('created_at', 'created_at');
  (syncQueue as unknown as IDBObjectStore).createIndex('task_id', 'task_id');
  const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
  tasks.createIndex('deleted_at', 'deleted_at');
  tasks.createIndex('updated_at', 'updated_at');
  tasks.createIndex('user_id', 'user_id');
}

async function withDb<T>(db: PsyklDb | undefined, callback: (database: PsyklDb) => Promise<T>): Promise<T> {
  if (db) {
    return callback(db);
  }

  const ownedDb = await openPsyklDb();
  try {
    return await callback(ownedDb);
  } finally {
    ownedDb.close();
  }
}

export {
  deleteFailedOp,
  deleteMeta,
  deleteSyncOp,
  deleteTask,
  enqueueSyncOp,
  getMeta,
  getTask,
  listFailedOps,
  listSyncQueue,
  listTasks,
  openPsyklDb,
  putFailedOp,
  putMeta,
  putTask,
  putTaskAndEnqueueSyncOp,
};
