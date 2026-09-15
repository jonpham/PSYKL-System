const NAG_THRESHOLD = 25;
const WRITE_CEILING = 100;

type SyncPressureLevel = 'ok' | 'nag' | 'ceiling';

function syncPressureLevel(queueLength: number): SyncPressureLevel {
  if (queueLength >= WRITE_CEILING) {
    return 'ceiling';
  }
  if (queueLength >= NAG_THRESHOLD) {
    return 'nag';
  }
  return 'ok';
}

/**
 * Thrown by `sync-client.ts`'s `enqueueOptimistic` when the local queue is
 * already at `WRITE_CEILING` — offline is a degraded mode and new writes
 * are refused until the queue drains, per DESIGN.md's Offline Posture.
 */
class SyncWriteCeilingError extends Error {
  constructor() {
    super('Reconnect to keep adding.');
    this.name = 'SyncWriteCeilingError';
  }
}

export { NAG_THRESHOLD, syncPressureLevel, SyncWriteCeilingError, WRITE_CEILING };
export type { SyncPressureLevel };
