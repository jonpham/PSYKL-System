import { type DBSchema, type IDBPDatabase } from 'idb';

import type { Task } from '../api/client';

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

type EntityType = 'list' | 'task';

interface SyncQueueEntry {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  op: 'create' | 'patch' | 'delete';
  body: unknown;
  idempotency_key: string;
  attempts: number;
  next_attempt_at: string;
  created_at: string;
}

interface SyncQueueEntryV1 {
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

interface ListRecord {
  id: string;
  user_id: string;
  title: string;
  position: string;
  created_at: string;
  updated_at: string;
  server_updated_at: string;
  deleted_at: string | null;
}

interface PsyklDbSchema extends DBSchema {
  failed_ops: {
    key: string;
    value: FailedOpEntry;
    indexes: { created_at: string; entity_id: string };
  };
  lists: {
    key: string;
    value: ListRecord;
    indexes: { deleted_at: string; position: string; updated_at: string };
  };
  sync_meta: { key: string; value: SyncMetaEntry };
  sync_queue: {
    key: string;
    value: SyncQueueEntry;
    indexes: { created_at: string; entity_id: string };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { deleted_at: string; list_id: string; updated_at: string; user_id: string };
  };
}

type PsyklDb = IDBPDatabase<PsyklDbSchema>;

export type {
  EntityType,
  FailedOpEntry,
  ListRecord,
  PsyklDb,
  PsyklDbSchema,
  SyncMetaEntry,
  SyncQueueEntry,
  SyncQueueEntryV1,
};
