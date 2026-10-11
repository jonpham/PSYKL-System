import type { ListRecord } from '../db/idb.types';
import { useListsApiClient } from './useLists.api';
import { useListsSyncClient } from './useLists.sync';

interface UseListsResult {
  canDelete: boolean;
  createList(title: string): Promise<ListRecord>;
  deleteList(id: string, deletedAt?: string): Promise<void>;
  lists: ListRecord[];
  moveList(id: string, before: ListRecord | null, after: ListRecord | null): Promise<void>;
  renameList(id: string, title: string): Promise<void>;
}

function useLists(): UseListsResult {
  const { useOfflineMode } = useUserSettings();

  if (useOfflineMode) {
    return useListsSyncClient();
  } else {
    return useListsApiClient();
  }
}

export { useLists };
export type { UseListsResult };
