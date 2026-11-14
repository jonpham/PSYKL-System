import type { ListRecord } from '../db/idb.types';
import { useListsApiClient } from './useLists.api';
import { useListsSyncClient } from './useLists.sync';
import { useUserSettings } from './useUserSettings';

interface UseListsResult {
  /** False for the default list (Decision 16) and for the last remaining list. */
  canDeleteList(id: string): boolean;
  createList(title: string): Promise<ListRecord>;
  deleteList(id: string, deletedAt?: string): Promise<void>;
  lists: ListRecord[];
  moveList(id: string, before: ListRecord | null, after: ListRecord | null): Promise<void>;
  renameList(id: string, title: string): Promise<void>;
}

/**
 * The data-path seam (online-offline-modes DESIGN.md Decision 1). Components
 * call this and never learn which path is active. Branching between two hooks
 * is safe only because Offline Mode cannot change within one mounted tree —
 * `SettingsProvider` remounts its children when it does.
 */
function useLists(): UseListsResult {
  const { offlineMode } = useUserSettings();
  return offlineMode ? useListsSyncClient() : useListsApiClient();
}

// Sync-store helpers re-exported so existing importers keep working; they move
// to their sync-only consumers when sync goes behind services (Decision 8).
export { notifyListSubscribers, resetUseListsForTest, subscribeToListChanges } from './useLists.sync';
export { useLists };
export type { UseListsResult };
