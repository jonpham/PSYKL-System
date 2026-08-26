import type { Task } from '../api/client';
import { putList, putTask } from '../db/idb';
import type { ListRecord, PsyklDb, SyncQueueEntry } from '../db/idb.types';

async function writeBackResponse(entry: SyncQueueEntry, data: unknown, db?: PsyklDb): Promise<void> {
  if (entry.entity_type === 'list') {
    await putList(data as ListRecord, db);
    return;
  }
  await putTask(data as Task, db);
}

export { writeBackResponse };
