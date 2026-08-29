import type { Task } from '../api/client';
import type { EntityApiResult } from '../api/tasks.api-client';
import type { EntityType, PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { enqueue } from './replay';

interface SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
  patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
  delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
  hydrate(): Promise<void>;
}

interface SyncClientConfig<TEntity> {
  entityType: EntityType;
  listRemote: () => Promise<EntityApiResult<TEntity[]>>;
  put: (record: TEntity, db?: PsyklDb) => Promise<void>;
}

function createSyncClient<TEntity, TInput, TPatchInput, TDeleteInput>(
  config: SyncClientConfig<TEntity>,
): SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  return {
    async create(entityId, body, optimistic) {
      await enqueueOptimistic(config, entityId, body, 'create', optimistic);
      return optimistic;
    },
    async patch(entityId, body, optimistic) {
      await enqueueOptimistic(config, entityId, body, 'patch', optimistic);
      return optimistic;
    },
    async delete(entityId, body, optimistic) {
      await enqueueOptimistic(config, entityId, body, 'delete', optimistic);
    },
    async hydrate() {
      const result = await config.listRemote();
      if (!result.data) {
        return;
      }
      await Promise.all(result.data.map((record) => config.put(record)));
    },
  };
}

// `enqueue()`'s `optimisticTask` writes the Task + its queue entry in one
// IDB transaction (`putTaskAndEnqueueSyncOp`) — preserves the atomicity
// Task mutations already had before this refactor. No equivalent primitive
// exists for List (useLists.ts never had one either), so List falls
// through to the two-step put-then-enqueue path, unchanged from today.
async function enqueueOptimistic<TEntity>(
  config: Pick<SyncClientConfig<TEntity>, 'entityType' | 'put'>,
  entityId: string,
  body: unknown,
  op: SyncQueueEntry['op'],
  optimistic: TEntity,
): Promise<void> {
  if (config.entityType === 'task') {
    await enqueue({ body, entityId, entityType: 'task', op, optimisticTask: optimistic as unknown as Task });
    return;
  }
  await config.put(optimistic);
  await enqueue({ body, entityId, entityType: config.entityType, op });
}

export { createSyncClient };
export type { SyncClient, SyncClientConfig };
