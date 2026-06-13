import { v7 as uuidv7 } from 'uuid';

import type { Task } from '../api/client';
import { deleteMeta, deleteSyncOp, enqueueSyncOp, getMeta, listSyncQueue, openPsyklDb, putTask } from '../db/idb';
import type { PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { moveToFailedOps } from './replay.failed-ops';
import { sendEntry } from './replay.transport';

const replayLockKey = 'replay_lock';
const staleLockMs = 30_000;

type EnqueueInput = { body: unknown; op: SyncQueueEntry['op']; taskId: string };

type ReplayOptions = {
  db?: PsyklDb;
  now?: () => Date;
  owner?: string;
  transport?: ReplayTransport;
};

type ReplayResult = { failed: number; replayed: number; retried: number };

type ReplayTransport = (entry: SyncQueueEntry) => Promise<ReplayTransportResult>;

type ReplayTransportResult = {
  data?: Task;
  error?: unknown;
  status: number;
};

type ReplayLockValue = { heartbeat_at: string; owner: string };

async function enqueue(input: EnqueueInput, options: ReplayOptions = {}): Promise<SyncQueueEntry> {
  const now = options.now?.() ?? new Date();
  const entry: SyncQueueEntry = {
    id: uuidv7(),
    task_id: input.taskId,
    op: input.op,
    body: input.body,
    idempotency_key: uuidv7(),
    attempts: 0,
    next_attempt_at: now.toISOString(),
    created_at: now.toISOString(),
  };
  await enqueueSyncOp(entry, options.db);
  return entry;
}

async function replay(options: ReplayOptions = {}): Promise<ReplayResult> {
  const owner = options.owner ?? uuidv7();
  const acquired = await acquireReplayLock({ ...options, owner });
  const result = { failed: 0, replayed: 0, retried: 0 };
  if (!acquired) {
    return result;
  }

  try {
    for (const entry of await dueEntries(options)) {
      await replayEntry(entry, options, result);
    }
    return result;
  } finally {
    await releaseReplayLock({ ...options, owner });
  }
}

async function acquireReplayLock(options: ReplayOptions = {}): Promise<boolean> {
  const owner = options.owner ?? uuidv7();
  const now = options.now?.() ?? new Date();
  const database = options.db ?? (await openPsyklDb());
  try {
    const transaction = database.transaction('sync_meta', 'readwrite');
    const existing = await transaction.store.get(replayLockKey);
    const lock = parseReplayLock(existing?.value);
    if (lock && Date.parse(lock.heartbeat_at) + staleLockMs >= now.getTime()) {
      await transaction.done;
      return lock.owner === owner;
    }

    await transaction.store.put({
      key: replayLockKey,
      value: { owner, heartbeat_at: now.toISOString() },
    });
    await transaction.done;
    return true;
  } finally {
    if (!options.db) {
      database.close();
    }
  }
}

async function releaseReplayLock(options: Pick<ReplayOptions, 'db' | 'owner'>): Promise<void> {
  const existing = await getMeta(replayLockKey, options.db);
  const lock = parseReplayLock(existing?.value);
  if (lock?.owner === options.owner) {
    await deleteMeta(replayLockKey, options.db);
  }
}

async function dueEntries(options: ReplayOptions): Promise<SyncQueueEntry[]> {
  const now = options.now?.() ?? new Date();
  const queue = await listSyncQueue(options.db);
  return queue.filter((entry) => Date.parse(entry.next_attempt_at) <= now.getTime());
}

async function replayEntry(entry: SyncQueueEntry, options: ReplayOptions, result: ReplayResult): Promise<void> {
  try {
    const response = await (options.transport ?? sendEntry)(entry);
    if (response.status >= 200 && response.status < 300 && response.data) {
      await putTask(response.data, options.db);
      await deleteSyncOp(entry.id, options.db);
      result.replayed += 1;
      return;
    }
    if (response.status >= 400 && response.status < 500) {
      await moveToFailedOps(entry, options, response.status, response.error);
      result.failed += 1;
      return;
    }
  } catch {
    await scheduleRetry(entry, options);
    result.retried += 1;
    return;
  }

  await scheduleRetry(entry, options);
  result.retried += 1;
}

async function scheduleRetry(entry: SyncQueueEntry, options: ReplayOptions): Promise<void> {
  const now = options.now?.() ?? new Date();
  const attempts = entry.attempts + 1;
  await enqueueSyncOp(
    {
      ...entry,
      attempts,
      next_attempt_at: new Date(now.getTime() + 2 ** attempts * 1_000).toISOString(),
    },
    options.db,
  );
}

function parseReplayLock(value: unknown): ReplayLockValue | undefined {
  if (!value || typeof value !== 'object' || !('owner' in value) || !('heartbeat_at' in value)) {
    return undefined;
  }
  const lock = value as Record<string, unknown>;
  if (typeof lock['owner'] !== 'string' || typeof lock['heartbeat_at'] !== 'string') {
    return undefined;
  }
  return { heartbeat_at: lock['heartbeat_at'], owner: lock['owner'] };
}

export { acquireReplayLock, enqueue, releaseReplayLock, replay };
export type { EnqueueInput, ReplayOptions, ReplayResult, ReplayTransport, ReplayTransportResult };
