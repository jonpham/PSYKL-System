import {
  apiClient,
  type Task,
  type TaskDeleteInput,
  type TaskInput,
  taskMutationRequestParams,
  type TaskPatchInput,
  taskRequestParams,
} from './client';

interface EntityApiResult<T> {
  data?: T;
  error?: unknown;
  status: number;
}

async function listTasksRemote(): Promise<EntityApiResult<Task[]>> {
  const { data, error, response } = await apiClient.GET('/tasks', {
    params: { ...taskRequestParams.params, query: { include_deleted: '1' } },
  });
  return { data, error, status: response.status };
}

async function createTaskRemote(input: TaskInput, idempotencyKey: string): Promise<EntityApiResult<Task>> {
  const { data, error, response } = await apiClient.POST('/tasks', {
    body: input,
    ...taskMutationRequestParams(idempotencyKey),
  });
  return { data, error, status: response.status };
}

async function patchTaskRemote(
  id: string,
  input: TaskPatchInput,
  idempotencyKey: string,
): Promise<EntityApiResult<Task>> {
  const { data, error, response } = await apiClient.PATCH('/tasks/{id}', {
    body: input,
    params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
  });
  return { data, error, status: response.status };
}

async function deleteTaskRemote(
  id: string,
  input: TaskDeleteInput,
  idempotencyKey: string,
): Promise<EntityApiResult<Task>> {
  const { data, error, response } = await apiClient.DELETE('/tasks/{id}', {
    body: input,
    params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
  });
  return { data, error, status: response.status };
}

export { createTaskRemote, deleteTaskRemote, listTasksRemote, patchTaskRemote };
export type { EntityApiResult };
