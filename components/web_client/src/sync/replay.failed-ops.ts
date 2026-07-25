import { deleteFailedOp, deleteSyncOp, listFailedOps, putFailedOp } from '../db/idb';
import type { SyncQueueEntry } from '../db/idb.types';
import type { ReplayOptions } from './replay';

const failedOpsWarningThreshold = 50;
const failedOpsCap = 100;

async function moveToFailedOps(
  entry: SyncQueueEntry,
  options: ReplayOptions,
  status: number,
  error: unknown,
): Promise<void> {
  const failedAt = (options.now?.() ?? new Date()).toISOString();
  const errorMessage = serializeError(error ?? `HTTP ${status}`);
  const detail = { error: errorMessage, id: entry.id, status };
  console.error('Permanent sync failure', detail);
  await putFailedOp({ ...entry, error: errorMessage, failed_at: failedAt }, options.db);
  await deleteSyncOp(entry.id, options.db);
  dispatchPermanentFail(detail);
  await enforceFailedOpsCap(options);
}

async function enforceFailedOpsCap(options: ReplayOptions): Promise<void> {
  const failedOps = await listFailedOps(options.db);
  if (failedOps.length === failedOpsWarningThreshold) {
    console.warn('Sync failed_ops reached warning threshold', {
      count: failedOps.length,
      threshold: failedOpsWarningThreshold,
    });
  }
  for (const failedOp of failedOps.slice(0, Math.max(0, failedOps.length - failedOpsCap))) {
    await deleteFailedOp(failedOp.id, options.db);
  }
}

function dispatchPermanentFail(detail: { error: string; id: string; status: number }): void {
  if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent('sync:permanent-fail', { detail }));
  }
}

function serializeError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export { moveToFailedOps };
