import { apiClient, taskRequestParams } from './client';
import type { EntityApiResult } from './tasks.api-client';
import type { components } from './types';

type DeletedResponse = components['schemas']['DeletedResponse'];

async function listDeletedRemote(): Promise<EntityApiResult<DeletedResponse>> {
  const { data, error, response } = await apiClient.GET('/deleted', {
    params: taskRequestParams.params,
  });
  return { data, error, status: response.status };
}

export { listDeletedRemote };
export type { DeletedResponse };
