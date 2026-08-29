import type {
  List,
  ListDeleteInput,
  ListInput,
  ListPatchInput,
  Task,
  TaskDeleteInput,
  TaskInput,
  TaskPatchInput,
} from '../api/client';
import { createListRemote, deleteListRemote, patchListRemote } from '../api/lists.api-client';
import type { EntityApiResult } from '../api/tasks.api-client';
import { createTaskRemote, deleteTaskRemote, patchTaskRemote } from '../api/tasks.api-client';
import type { SyncQueueEntry } from '../db/idb.types';
import type { ReplayTransportResult } from './replay';

async function sendEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  return entry.entity_type === 'list' ? sendListEntry(entry) : sendTaskEntry(entry);
}

async function sendTaskEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  if (entry.op === 'create') {
    return withStatus(await createTaskRemote(entry.body as TaskInput, entry.idempotency_key));
  }
  if (entry.op === 'patch') {
    return withStatus(await patchTaskRemote(entry.entity_id, entry.body as TaskPatchInput, entry.idempotency_key));
  }
  return withStatus(await deleteTaskRemote(entry.entity_id, entry.body as TaskDeleteInput, entry.idempotency_key));
}

async function sendListEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  if (entry.op === 'create') {
    return withStatus(await createListRemote(entry.body as ListInput, entry.idempotency_key));
  }
  if (entry.op === 'patch') {
    return withStatus(await patchListRemote(entry.entity_id, entry.body as ListPatchInput, entry.idempotency_key));
  }
  return withStatus(await deleteListRemote(entry.entity_id, entry.body as ListDeleteInput, entry.idempotency_key));
}

function withStatus(result: EntityApiResult<List | Task>): ReplayTransportResult {
  return {
    data: result.data,
    error: result.error,
    status: result.status,
  };
}

export { sendEntry };
