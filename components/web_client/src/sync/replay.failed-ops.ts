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
  const errorMessage = String(error ?? `HTTP ${status}`);
  console.error('Permanent sync failure', { error: errorMessage, id: entry.id, status });
  await putFailedOp({ ...entry, error: errorMessage, failed_at: failedAt }, options.db);
  await deleteSyncOp(entry.id, options.db);
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

export { moveToFailedOps };
