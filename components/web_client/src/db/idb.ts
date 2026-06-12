import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task } from '../api/client';

const databaseName = 'psykl';
export const CURRENT_SCHEMA_VERSION = 1;

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

export interface SyncQueueEntry {
  id: string;
  task_id: string;
  op: 'create' | 'patch' | 'delete';
  body: JsonValue;
  idempotency_key: string;
  attempts: number;
  next_attempt_at: string;
  created_at: string;
}

export interface SyncMetaEntry {
  key: string;
  value: JsonValue;
}

export interface FailedOpEntry extends SyncQueueEntry {
  failed_at: string;
  error: string;
}

interface PsyklDbSchema extends DBSchema {
  failed_ops: {
    key: string;
    value: FailedOpEntry;
    indexes: {
      created_at: string;
      task_id: string;
    };
  };
  sync_meta: {
    key: string;
    value: SyncMetaEntry;
  };
  sync_queue: {
    key: string;
    value: SyncQueueEntry;
    indexes: {
      created_at: string;
      task_id: string;
    };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: {
      deleted_at: string;
      updated_at: string;
      user_id: string;
    };
  };
}

export type PsyklDb = IDBPDatabase<PsyklDbSchema>;

export async function openPsyklDb(): Promise<PsyklDb> {
  return openDB<PsyklDbSchema>(databaseName, CURRENT_SCHEMA_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        createV1Stores(db);
      }
    },
  });
}

export async function putTask(task: Task, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('tasks', task);
  });
}

export async function listTasks(db?: PsyklDb): Promise<Task[]> {
  return withDb(db, async (database) => database.getAll('tasks'));
}

export async function getTask(id: string, db?: PsyklDb): Promise<Task | undefined> {
  return withDb(db, async (database) => database.get('tasks', id));
}

export async function deleteTask(id: string, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.delete('tasks', id);
  });
}

export async function enqueueSyncOp(entry: SyncQueueEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('sync_queue', entry);
  });
}

export async function listSyncQueue(db?: PsyklDb): Promise<SyncQueueEntry[]> {
  return withDb(db, async (database) => database.getAllFromIndex('sync_queue', 'created_at'));
}

export async function putMeta(entry: SyncMetaEntry, db?: PsyklDb): Promise<void> {
  return withDb(db, async (database) => {
    await database.put('sync_meta', entry);
  });
}

export async function getMeta(key: string, db?: PsyklDb): Promise<SyncMetaEntry | undefined> {
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
