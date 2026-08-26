import { apiClient, type Task, type TaskInput, taskMutationRequestParams } from '../api/client';
import type { components } from '../api/types';
import type { SyncQueueEntry } from '../db/idb.types';
import type { ReplayTransportResult } from './replay';

type List = components['schemas']['List'];
type ListDeleteInput = components['schemas']['ListDeleteInput'];
type ListInput = components['schemas']['ListInput'];
type ListPatchInput = components['schemas']['ListPatchInput'];
type TaskDeleteInput = components['schemas']['TaskDeleteInput'];
type TaskPatchInput = components['schemas']['TaskPatchInput'];

async function sendEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  return entry.entity_type === 'list' ? sendListEntry(entry) : sendTaskEntry(entry);
}

async function sendTaskEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  if (entry.op === 'create') {
    return withStatus(
      await apiClient.POST('/tasks', {
        body: entry.body as TaskInput,
        ...taskMutationRequestParams(entry.idempotency_key),
      }),
    );
  }
  if (entry.op === 'patch') {
    return withStatus(
      await apiClient.PATCH('/tasks/{id}', {
        body: entry.body as TaskPatchInput,
        params: { ...taskMutationRequestParams(entry.idempotency_key).params, path: { id: entry.entity_id } },
      }),
    );
  }
  return withStatus(
    await apiClient.DELETE('/tasks/{id}', {
      body: entry.body as TaskDeleteInput,
      params: { ...taskMutationRequestParams(entry.idempotency_key).params, path: { id: entry.entity_id } },
    }),
  );
}

async function sendListEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
  if (entry.op === 'create') {
    return withStatus(
      await apiClient.POST('/lists', {
        body: entry.body as ListInput,
        ...taskMutationRequestParams(entry.idempotency_key),
      }),
    );
  }
  if (entry.op === 'patch') {
    return withStatus(
      await apiClient.PATCH('/lists/{id}', {
        body: entry.body as ListPatchInput,
        params: { ...taskMutationRequestParams(entry.idempotency_key).params, path: { id: entry.entity_id } },
      }),
    );
  }
  return withStatus(
    await apiClient.DELETE('/lists/{id}', {
      body: entry.body as ListDeleteInput,
      params: { ...taskMutationRequestParams(entry.idempotency_key).params, path: { id: entry.entity_id } },
    }),
  );
}

function withStatus(result: { data?: List | Task; error?: unknown; response: Response }): ReplayTransportResult {
  return {
    data: result.data,
    error: result.error,
    status: result.response.status,
  };
}

export { sendEntry };
