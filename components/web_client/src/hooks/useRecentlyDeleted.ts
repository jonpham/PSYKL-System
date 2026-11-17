import { useRecentlyDeletedApiClient } from './useRecentlyDeleted.api';
import type { DeletedItem } from './useRecentlyDeleted.items';
import { useRecentlyDeletedSyncClient } from './useRecentlyDeleted.sync';
import { useUserSettings } from './useUserSettings';

interface UseRecentlyDeletedResult {
  items: DeletedItem[];
  restore(item: DeletedItem): Promise<void>;
}

/**
 * The data-path seam for Recently Deleted (online-offline-modes DESIGN.md
 * Decision 1); see `useLists` for why branching between two hooks is safe.
 */
function useRecentlyDeleted(): UseRecentlyDeletedResult {
  const { offlineMode } = useUserSettings();
  return offlineMode ? useRecentlyDeletedSyncClient() : useRecentlyDeletedApiClient();
}

export { useRecentlyDeleted };
export type { DeletedItem, UseRecentlyDeletedResult };
