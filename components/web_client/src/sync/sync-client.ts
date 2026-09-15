import type { Task } from '../api/client';
import type { EntityApiResult } from '../api/tasks.api-client';
import { listSyncQueue } from '../db/idb';
import type { EntityType, PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { enqueue } from './replay';

interface SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  create(entityId: string, body: TInput, optimistic: TEntity): Promise<TEntity>;
  delete(entityId: string, body: TDeleteInput, optimistic: TEntity): Promise<void>;
  list(): Promise<TEntity[]>;
  listPending(): Promise<string[]>;
  patch(entityId: string, body: TPatchInput, optimistic: TEntity): Promise<TEntity>;
  restore(entityId: string, body: unknown, optimistic: TEntity): Promise<TEntity>;
}

interface SyncClientConfig<TEntity> {
  entityType: EntityType;
  listLocal: () => Promise<TEntity[]>;
  listRemote: () => Promise<EntityApiResult<TEntity[]>>;
  put: (record: TEntity, db?: PsyklDb) => Promise<void>;
}

class HydrationExhaustedError extends Error {
  constructor(entityType: EntityType, cause: unknown) {
    super(`${entityType} hydrate failed and no local cache exists`);
    this.name = 'HydrationExhaustedError';
    this.cause = cause;
  }
}

function createSyncClient<TEntity, TInput, TPatchInput, TDeleteInput>(
  config: SyncClientConfig<TEntity>,
): SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  let hydrated = false;

  async function absorb(records: TEntity[]): Promise<void> {
    await Promise.all(records.map((record) => config.put(record)));
  }

  // Attempts a remote refresh at most once per page load — later calls
  // no-op here regardless of whether the first attempt succeeded, matching
  // this app's existing "never auto-retry hydrate mid-session" behavior.
  async function hydrateOnce(): Promise<void> {
    if (hydrated) {
      return;
    }
    hydrated = true;
    const result = await config.listRemote();
    if (result.error || !result.data) {
      throw new Error(`hydrate failed: ${JSON.stringify(result.error)}`);
    }
    await absorb(result.data);
  }

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
    async restore(entityId, body, optimistic) {
      await enqueueOptimistic(config, entityId, body, 'restore', optimistic);
      return optimistic;
    },
    async list() {
      try {
        await hydrateOnce();
      } catch (cause) {
        const local = await config.listLocal();
        if (local.length === 0) {
          throw new HydrationExhaustedError(config.entityType, cause);
        }
        return local;
      }
      return config.listLocal();
    },
    async listPending() {
      const queue = await listSyncQueue();
      return queue.filter((entry) => entry.entity_type === config.entityType).map((entry) => entry.entity_id);
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

export { createSyncClient, HydrationExhaustedError };
export type { SyncClient, SyncClientConfig };
