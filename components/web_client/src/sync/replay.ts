import { v7 as uuidv7 } from 'uuid';

import type { Task } from '../api/client';
import { deleteSyncOp, enqueueSyncOp, listSyncQueue, putTask } from '../db/idb';
import type { PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { moveToFailedOps } from './replay.failed-ops';
import { acquireReplayLock, releaseReplayLock } from './replay.lock';
import { sendEntry } from './replay.transport';

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
type ReplayEntryOutcome = 'failed' | 'replayed' | 'retried';

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
      const outcome = await replayEntry(entry, options, result);
      if (outcome === 'retried') {
        break;
      }
    }
    return result;
  } finally {
    await releaseReplayLock({ ...options, owner });
  }
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
      await putTask(response.data, options.db);
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
    await scheduleRetry(entry, options);
    result.retried += 1;
    return 'retried';
  }

  await scheduleRetry(entry, options);
  result.retried += 1;
  return 'retried';
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

export { acquireReplayLock, enqueue, releaseReplayLock, replay };
export type { EnqueueInput, ReplayOptions, ReplayResult, ReplayTransport, ReplayTransportResult };
