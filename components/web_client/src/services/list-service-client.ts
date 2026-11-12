import type { List, ListDeleteInput, ListInput, ListPatchInput } from '../api/client';
import {
  createListRemote,
  deleteListRemote,
  listListsRemote,
  patchListRemote,
  restoreListRemote,
} from '../api/lists.api-client';
import { listLists, putList } from '../db/idb';
import { createSyncClient, resetSyncClientHydrationForTest } from '../sync/sync-client';
import { createServiceClient, type EntityApiClient, type ServiceClient } from './service-client';

const listApiClient: EntityApiClient<List, ListInput, ListPatchInput, ListDeleteInput> = {
  create: createListRemote,
  delete: deleteListRemote,
  list: listListsRemote,
  patch: patchListRemote,
  restore: restoreListRemote,
};

const listSyncClient = createSyncClient<List, ListInput, ListPatchInput, ListDeleteInput>({
  entityType: 'list',
  listLocal: listLists,
  listRemote: listListsRemote,
  put: putList,
});

type ListServiceClient = ServiceClient<List, ListInput, ListPatchInput, ListDeleteInput>;

/** The inner clients above are the singletons; this shim is rebuilt per
 * Offline Mode (DESIGN.md Decision 6). */
function createListServiceClient(offlineCapable: boolean): ListServiceClient {
  return createServiceClient({ apiClient: listApiClient, offlineCapable, syncClient: listSyncClient });
}

function resetListServiceClientForTest(): void {
  resetSyncClientHydrationForTest(listSyncClient);
}

export { createListServiceClient, resetListServiceClientForTest };
export type { ListServiceClient };
