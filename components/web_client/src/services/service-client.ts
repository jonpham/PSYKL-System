import { v7 as uuidv7 } from 'uuid';

import type { EntityApiResult } from '../api/tasks.api-client';
import type { SyncClient } from '../sync/sync-client';

interface EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(input: TInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
  delete(id: string, input: TDeleteInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
  list(): Promise<EntityApiResult<TEntity[]>>;
  patch(id: string, input: TPatchInput, idempotencyKey: string): Promise<EntityApiResult<TEntity>>;
}

type ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput> =
  | {
      apiClient: EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput>;
      offlineCapable: true;
      syncClient: SyncClient<TEntity, TInput, TPatchInput, TDeleteInput>;
    }
  | {
      apiClient: EntityApiClient<TEntity, TInput, TPatchInput, TDeleteInput>;
      offlineCapable: false;
    };

interface ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
  delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
  hydrate(): Promise<void>;
  patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
}

function createServiceClient<TEntity, TInput, TPatchInput, TDeleteInput>(
  config: ServiceClientConfig<TEntity, TInput, TPatchInput, TDeleteInput>,
): ServiceClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  return {
    async create(entityId, body, optimistic) {
      if (config.offlineCapable) {
        return config.syncClient.create(entityId, body, optimistic);
      }
      return unwrap(await config.apiClient.create(body, uuidv7()), 'create');
    },
    async patch(entityId, body, optimistic) {
      if (config.offlineCapable) {
        return config.syncClient.patch(entityId, body, optimistic);
      }
      return unwrap(await config.apiClient.patch(entityId, body, uuidv7()), 'patch');
    },
    async delete(entityId, body, optimistic) {
      if (config.offlineCapable) {
        await config.syncClient.delete(entityId, body, optimistic);
        return;
      }
      unwrap(await config.apiClient.delete(entityId, body, uuidv7()), 'delete');
    },
    async hydrate() {
      // Direct (offlineCapable: false) mode has no local cache to fill.
      if (config.offlineCapable) {
        await config.syncClient.hydrate();
      }
    },
  };
}

function unwrap<T>(result: EntityApiResult<T>, op: string): T {
  if (result.error || !result.data) {
    throw new Error(`${op} failed: ${JSON.stringify(result.error)}`);
  }
  return result.data;
}

export { createServiceClient };
export type { EntityApiClient, ServiceClient, ServiceClientConfig };
