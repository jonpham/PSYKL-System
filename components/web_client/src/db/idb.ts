import { openDB } from 'idb';

import type { Task } from '../api/client';
import type { PsyklDb, PsyklDbSchema, SyncMetaEntry, SyncQueueEntry } from './idb.types';

const databaseName = 'psykl';
export const CURRENT_SCHEMA_VERSION = 1;

async function openPsyklDb(): Promise<PsyklDb> {
  return openDB<PsyklDbSchema>(databaseName, CURRENT_SCHEMA_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        createV1Stores(db);
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

async function listSyncQueue(db?: PsyklDb): Promise<SyncQueueEntry[]> {
  return withDb(db, async (database) => database.getAllFromIndex('sync_queue', 'created_at'));
}

async function putMeta(entry: SyncMetaEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('sync_meta', entry);
  });
}

async function getMeta(key: string, db?: PsyklDb): Promise<SyncMetaEntry | undefined> {
  return withDb(db, async (database) => database.get('sync_meta', key));
}

function createV1Stores(db: PsyklDb): void {
  const failedOps = db.createObjectStore('failed_ops', { keyPath: 'id' });
  failedOps.createIndex('created_at', 'created_at');
  failedOps.createIndex('task_id', 'task_id');
  db.createObjectStore('sync_meta', { keyPath: 'key' });
  const syncQueue = db.createObjectStore('sync_queue', { keyPath: 'id' });
  syncQueue.createIndex('created_at', 'created_at');
  syncQueue.createIndex('task_id', 'task_id');
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

export { deleteTask, enqueueSyncOp, getMeta, getTask, listSyncQueue, listTasks, openPsyklDb, putMeta, putTask };
