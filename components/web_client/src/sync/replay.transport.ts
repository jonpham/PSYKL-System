import { apiClient, type Task, type TaskInput, taskMutationRequestParams } from '../api/client';
import type { components } from '../api/types';
import type { SyncQueueEntry } from '../db/idb.types';
import type { ReplayTransportResult } from './replay';

type TaskDeleteInput = components['schemas']['TaskDeleteInput'];
type TaskPatchInput = components['schemas']['TaskPatchInput'];

async function sendEntry(entry: SyncQueueEntry): Promise<ReplayTransportResult> {
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

function withStatus(result: { data?: Task; error?: unknown; response: Response }): ReplayTransportResult {
  return {
    data: result.data,
    error: result.error,
    status: result.response.status,
  };
}

export { sendEntry };
