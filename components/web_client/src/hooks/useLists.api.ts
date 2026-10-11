import { notImplementedOnline } from './online-path.stub';
import type { UseListsResult } from './useLists';

const NO_LISTS: UseListsResult['lists'] = [];

/**
 * The online-only path for Lists (Offline Mode off). Stubbed: online-offline-modes
 * Spec 2 implements it over TanStack Query against a direct (`offlineCapable:
 * false`) list Service Client shim (DESIGN.md Decision 6). It must not import
 * `useLists.positions` or `useLists.default-list`: both read IndexedDB directly
 * and are sync-path only. Server-side positions and default-list creation do
 * not exist yet (Decision 7). Until then it shows no lists and every write rejects.
 */
function useListsApiClient(): UseListsResult {
  return {
    canDelete: false,
    createList: () => notImplementedOnline('createList'),
    deleteList: () => notImplementedOnline('deleteList'),
    lists: NO_LISTS,
    moveList: () => notImplementedOnline('moveList'),
    renameList: () => notImplementedOnline('renameList'),
  };
}

export { useListsApiClient };
