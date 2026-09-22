import { v7 as uuidv7 } from 'uuid';

import { getMeta, putMeta } from '../db/idb';
import type { JsonValue } from '../db/idb.types';

interface StaleWriteVersion {
  title?: string;
  updated_at?: string;
}

interface StaleWriteRecord {
  entityId: string;
  id: string;
  recordedAt: string;
  won: StaleWriteVersion;
  wrote: StaleWriteVersion;
}

const KEY = 'stale-writes';
// Matches Recently Deleted's window: a conflict the user never looked at stops
// being news after a month.
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function isLive(record: StaleWriteRecord, now: number): boolean {
  return now - new Date(record.recordedAt).getTime() < RETENTION_MS;
}

async function readAll(): Promise<StaleWriteRecord[]> {
  const entry = await getMeta(KEY);
  return Array.isArray(entry?.value) ? (entry.value as unknown as StaleWriteRecord[]) : [];
}

/**
 * A conflict is a fact about this device's history, so it lives in `sync_meta`
 * and is never enqueued. Best-effort by design: clearing the app's local data
 * clears these too.
 */
async function listStaleWrites(): Promise<StaleWriteRecord[]> {
  const now = Date.now();
  const live = (await readAll()).filter((record) => isLive(record, now));
  return [...live].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

async function recordStaleWrite(input: Omit<StaleWriteRecord, 'id'>): Promise<void> {
  const now = Date.now();
  const kept = (await readAll()).filter((record) => isLive(record, now));
  const next = [...kept, { ...input, id: uuidv7() }];
  await putMeta({ key: KEY, value: next as unknown as JsonValue });
}

async function dismissStaleWrite(id: string): Promise<void> {
  const now = Date.now();
  const kept = (await readAll()).filter((record) => isLive(record, now) && record.id !== id);
  await putMeta({ key: KEY, value: kept as unknown as JsonValue });
}

export { dismissStaleWrite, listStaleWrites, recordStaleWrite };
export type { StaleWriteRecord, StaleWriteVersion };
