import { type DBSchema, type IDBPDatabase } from 'idb';

import type { Task } from '../api/client';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

interface SyncQueueEntry {
  id: string;
  task_id: string;
  op: 'create' | 'patch' | 'delete';
  body: unknown;
  idempotency_key: string;
  attempts: number;
  next_attempt_at: string;
  created_at: string;
}

interface SyncMetaEntry {
  key: string;
  value: JsonValue;
}

interface FailedOpEntry extends SyncQueueEntry {
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

type PsyklDb = IDBPDatabase<PsyklDbSchema>;

export type { FailedOpEntry, PsyklDb, PsyklDbSchema, SyncMetaEntry, SyncQueueEntry };
