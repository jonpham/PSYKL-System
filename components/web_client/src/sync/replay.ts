import { v7 as uuidv7 } from 'uuid';

import type { Task } from '../api/client';
import { deleteSyncOp, enqueueSyncOp, listSyncQueue, putTaskAndEnqueueSyncOp } from '../db/idb';
import type { EntityType, PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { moveToFailedOps } from './replay.failed-ops';
import { acquireReplayLock, refreshReplayLock, releaseReplayLock } from './replay.lock';
import { sendEntry } from './replay.transport';
import { writeBackResponse } from './replay.writeback';
import { emitStaleWriteIfSuperseded } from './stale-write';

type EnqueueInput = {
  body: unknown;
  entityId: string;
  entityType: EntityType;
  op: SyncQueueEntry['op'];
  optimisticTask?: Task;
};

type ReplayOptions = {
  db?: PsyklDb;
  heartbeatIntervalMs?: number;
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
type ReplayEntryOutcome = 'failed' | 'replayed' | 'retried';

const MAX_REPLAY_ATTEMPTS = 10;

async function enqueue(input: EnqueueInput, options: ReplayOptions = {}): Promise<SyncQueueEntry> {
  const now = options.now?.() ?? new Date();
  const entry: SyncQueueEntry = {
    id: uuidv7(),
    entity_type: input.entityType,
    entity_id: input.entityId,
    op: input.op,
    body: input.body,
    idempotency_key: uuidv7(),
    attempts: 0,
    next_attempt_at: now.toISOString(),
    created_at: now.toISOString(),
  };
  if (input.optimisticTask) {
    await putTaskAndEnqueueSyncOp(input.optimisticTask, entry, options.db);
  } else {
    await enqueueSyncOp(entry, options.db);
  }
  return entry;
}

async function replay(options: ReplayOptions = {}): Promise<ReplayResult> {
  const owner = options.owner ?? uuidv7();
  const acquired = await acquireReplayLock({ ...options, owner });
  const result = { failed: 0, replayed: 0, retried: 0 };
  if (!acquired) {
    return result;
  }

  const stopHeartbeat = startReplayHeartbeat({ ...options, owner });
  try {
    for (const entry of await dueEntries(options)) {
      await replayEntry(entry, options, result);
    }
    return result;
  } finally {
    stopHeartbeat();
    await releaseReplayLock({ ...options, owner });
  }
}

function startReplayHeartbeat(options: ReplayOptions & { owner: string }): () => void {
  const interval = setInterval(() => {
    void refreshReplayLock(options).catch((error) => {
      console.error('Sync replay heartbeat failed', error);
    });
  }, options.heartbeatIntervalMs ?? 10_000);
  return () => clearInterval(interval);
}

async function dueEntries(options: ReplayOptions): Promise<SyncQueueEntry[]> {
  const now = options.now?.() ?? new Date();
  const queue = await listSyncQueue(options.db);
  return queue.filter((entry) => Date.parse(entry.next_attempt_at) <= now.getTime());
}

async function replayEntry(
  entry: SyncQueueEntry,
  options: ReplayOptions,
  result: ReplayResult,
): Promise<ReplayEntryOutcome> {
  try {
    const response = await (options.transport ?? sendEntry)(entry);
    if (response.status >= 200 && response.status < 300 && response.data) {
      emitStaleWriteIfSuperseded(entry, response.data);
      await writeBackResponse(entry, response.data, options.db);
      await deleteSyncOp(entry.id, options.db);
      result.replayed += 1;
      return 'replayed';
    }
    if (response.status >= 400 && response.status < 500) {
      await moveToFailedOps(entry, options, response.status, response.error);
      result.failed += 1;
      return 'failed';
    }
  } catch {
    const outcome = await scheduleRetry(entry, options);
    if (outcome === 'failed') {
      result.failed += 1;
    } else {
      result.retried += 1;
    }
    return outcome;
  }

  const outcome = await scheduleRetry(entry, options);
  if (outcome === 'failed') {
    result.failed += 1;
  } else {
    result.retried += 1;
  }
  return outcome;
}

async function scheduleRetry(entry: SyncQueueEntry, options: ReplayOptions): Promise<ReplayEntryOutcome> {
  const now = options.now?.() ?? new Date();
  const attempts = entry.attempts + 1;
  if (attempts >= MAX_REPLAY_ATTEMPTS) {
    await moveToFailedOps(entry, options, 0, `Gave up after ${String(attempts)} attempts`);
    return 'failed';
  }
  await enqueueSyncOp(
    {
      ...entry,
      attempts,
      next_attempt_at: new Date(now.getTime() + 2 ** attempts * 1_000).toISOString(),
    },
    options.db,
  );
  return 'retried';
}

export { acquireReplayLock, enqueue, MAX_REPLAY_ATTEMPTS, refreshReplayLock, releaseReplayLock, replay };
export type { EnqueueInput, ReplayOptions, ReplayResult, ReplayTransport, ReplayTransportResult };
