import type { Task } from '../api/client';
import { putTask } from '../db/idb';
import type { PsyklDb, SyncQueueEntry } from '../db/idb.types';

async function writeBackResponse(entry: SyncQueueEntry, data: unknown, db?: PsyklDb): Promise<void> {
  if (entry.entity_type === 'task') {
    await putTask(data as Task, db);
    return;
  }
  throw new Error(
    `writeBackResponse: unsupported entity_type "${entry.entity_type}" (list support lands in a later DevTask)`,
  );
}

export { writeBackResponse };
