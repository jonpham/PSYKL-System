import type { Task } from '../api/client';
import type { EntityApiResult } from '../api/tasks.api-client';
import { listSyncQueue } from '../db/idb';
import type { EntityType, PsyklDb, SyncQueueEntry } from '../db/idb.types';
import { enqueue } from './replay';
import { syncDiscrepancyLevel, SyncWriteCeilingError } from './sync-discrepancy';

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

// Keyed by the returned SyncClient instance so each `createSyncClient(...)`
// call (production singletons AND ad-hoc test instances alike) gets its own
// independently resettable hydration flag, without putting a test-only
// method on the `SyncClient` interface itself.
const hydrationResets = new WeakMap<object, () => void>();

function createSyncClient<TEntity extends { id: string }, TInput, TPatchInput, TDeleteInput>(
  config: SyncClientConfig<TEntity>,
): SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> {
  // The in-flight/settled promise itself, not a boolean — two `list()` calls
  // racing before the first fetch resolves (e.g. useSyncExternalStore's
  // subscribe() firing before the mount effect that used to be the only
  // hydrate trigger) must await the SAME attempt and observe the SAME
  // outcome, not have the second one short-circuit past a still-pending
  // first attempt with a premature "local is empty" read.
  let hydratePromise: Promise<void> | null = null;

  // A record this device has changed but not yet sent is NOT the server's to
  // overwrite: absorbing it would silently roll the user's change back, and the
  // queued op would then replay a change the UI no longer shows. The queue
  // entry is the authority until it drains.
  async function absorb(records: TEntity[]): Promise<void> {
    const queue = await listSyncQueue();
    const pending = new Set(
      queue.filter((entry) => entry.entity_type === config.entityType).map((entry) => entry.entity_id),
    );
    await Promise.all(records.filter((record) => !pending.has(record.id)).map((record) => config.put(record)));
  }

  // Attempts a remote refresh at most once per page load — later calls
  // return the already-settled promise regardless of whether the first
  // attempt succeeded, matching this app's existing "never auto-retry
  // hydrate mid-session" behavior.
  function hydrateOnce(): Promise<void> {
    hydratePromise ??= (async () => {
      const result = await config.listRemote();
      if (result.error || !result.data) {
        throw new Error(`hydrate failed: ${JSON.stringify(result.error)}`);
      }
      await absorb(result.data);
    })();
    return hydratePromise;
  }

  const client: SyncClient<TEntity, TInput, TPatchInput, TDeleteInput> = {
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

  hydrationResets.set(client, () => {
    hydratePromise = null;
  });
  return client;
}

/**
 * Test-only: resets a `SyncClient`'s "hydrated at most once" flag so a
 * production singleton (`taskSyncClient`/`listSyncClient`) can be
 * re-hydrated across test cases in the same file. Not part of the
 * `SyncClient` interface — call via each entity's `resetXServiceClientForTest()`
 * (`task-service-client.ts`/`list-service-client.ts`), which this app's hook
 * `resetUseXForTest()` helpers already call.
 */
function resetSyncClientHydrationForTest(client: SyncClient<unknown, unknown, unknown, unknown>): void {
  hydrationResets.get(client)?.();
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
  const queue = await listSyncQueue();
  if (syncDiscrepancyLevel(queue.length) === 'ceiling') {
    throw new SyncWriteCeilingError();
  }
  if (config.entityType === 'task') {
    await enqueue({ body, entityId, entityType: 'task', op, optimisticTask: optimistic as unknown as Task });
    return;
  }
  await config.put(optimistic);
  await enqueue({ body, entityId, entityType: config.entityType, op });
}

export { createSyncClient, HydrationExhaustedError, resetSyncClientHydrationForTest };
export type { SyncClient, SyncClientConfig };
