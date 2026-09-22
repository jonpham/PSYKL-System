import type { Task } from '../api/client';
import type { SyncQueueEntry } from '../db/idb.types';
import { recordStaleWrite } from '../preferences/staleWrites';

export type StaleWriteDetail = { task: Task };

/**
 * A patch "loses" a last-write-wins race when the server does not echo the
 * `updated_at` we sent — it kept a newer row from another device. Non-patch ops
 * never conflict this way (creates are new; deletes are terminal tombstones).
 *
 * Both halves are in hand here: `entry.body` is what this device wrote and
 * `serverTask` is what replaced it, so the record can show the user their own
 * words rather than only telling them they lost.
 */
export async function emitStaleWriteIfSuperseded(entry: SyncQueueEntry, serverTask: Task): Promise<void> {
  if (entry.op !== 'patch') {
    return;
  }
  const wrote = entry.body as { title?: string; updated_at?: string };
  if (!wrote.updated_at || serverTask.updated_at === wrote.updated_at) {
    return;
  }

  await recordStaleWrite({
    entityId: entry.entity_id,
    recordedAt: new Date().toISOString(),
    won: { title: serverTask.title, updated_at: serverTask.updated_at },
    wrote: { title: wrote.title, updated_at: wrote.updated_at },
  });

  if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
    globalThis.dispatchEvent(new CustomEvent<StaleWriteDetail>('sync:stale-write', { detail: { task: serverTask } }));
  }
}
