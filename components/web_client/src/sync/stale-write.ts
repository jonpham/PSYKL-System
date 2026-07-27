import type { Task } from '../api/client';
import type { SyncQueueEntry } from '../db/idb.types';

export type StaleWriteDetail = { task: Task };

/**
 * A patch "loses" a last-write-wins race when the server does not echo the
 * `updated_at` we sent — it kept a newer row from another device. Signal the UI
 * so it can tell the user their edit was superseded. Non-patch ops never
 * conflict this way (creates are new; deletes are terminal tombstones).
 */
export function emitStaleWriteIfSuperseded(entry: SyncQueueEntry, serverTask: Task): void {
  if (entry.op !== 'patch') {
    return;
  }
  const intended = (entry.body as { updated_at?: string }).updated_at;
  if (!intended || serverTask.updated_at === intended) {
    return;
  }
  if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent<StaleWriteDetail>('sync:stale-write', { detail: { task: serverTask } }));
  }
}
