import {
  apiClient,
  type List,
  type ListDeleteInput,
  type ListInput,
  type ListPatchInput,
  taskMutationRequestParams,
  taskRequestParams,
} from './client';
import type { EntityApiResult } from './tasks.api-client';

async function listListsRemote(): Promise<EntityApiResult<List[]>> {
  const { data, error, response } = await apiClient.GET('/lists', {
    params: taskRequestParams.params,
  });
  return { data, error, status: response.status };
}

async function createListRemote(input: ListInput, idempotencyKey: string): Promise<EntityApiResult<List>> {
  const { data, error, response } = await apiClient.POST('/lists', {
    body: input,
    ...taskMutationRequestParams(idempotencyKey),
  });
  return { data, error, status: response.status };
}

async function patchListRemote(
  id: string,
  input: ListPatchInput,
  idempotencyKey: string,
): Promise<EntityApiResult<List>> {
  const { data, error, response } = await apiClient.PATCH('/lists/{id}', {
    body: input,
    params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
  });
  return { data, error, status: response.status };
}

async function deleteListRemote(
  id: string,
  input: ListDeleteInput,
  idempotencyKey: string,
): Promise<EntityApiResult<List>> {
  const { data, error, response } = await apiClient.DELETE('/lists/{id}', {
    body: input,
    params: { ...taskMutationRequestParams(idempotencyKey).params, path: { id } },
  });
  return { data, error, status: response.status };
}

export { createListRemote, deleteListRemote, listListsRemote, patchListRemote };
