import type { List, ListDeleteInput, ListInput, ListPatchInput } from '../api/client';
import { createListRemote, deleteListRemote, listListsRemote, patchListRemote } from '../api/lists.api-client';
import { putList } from '../db/idb';
import { createSyncClient } from '../sync/sync-client';
import { createServiceClient, type EntityApiClient } from './service-client';

const listApiClient: EntityApiClient<List, ListInput, ListPatchInput, ListDeleteInput> = {
  create: createListRemote,
  delete: deleteListRemote,
  list: listListsRemote,
  patch: patchListRemote,
};

const listSyncClient = createSyncClient<List, ListInput, ListPatchInput, ListDeleteInput>({
  entityType: 'list',
  listRemote: listListsRemote,
  put: putList,
});

const listServiceClient = createServiceClient<List, ListInput, ListPatchInput, ListDeleteInput>({
  apiClient: listApiClient,
  offlineCapable: true,
  syncClient: listSyncClient,
});

export { listServiceClient };
