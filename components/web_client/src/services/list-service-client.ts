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
import { createServiceClient, type EntityApiClient } from './service-client';

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

const listServiceClient = createServiceClient<List, ListInput, ListPatchInput, ListDeleteInput>({
  apiClient: listApiClient,
  offlineCapable: true,
  syncClient: listSyncClient,
});

function resetListServiceClientForTest(): void {
  resetSyncClientHydrationForTest(listSyncClient);
}

export { listServiceClient, resetListServiceClientForTest };
