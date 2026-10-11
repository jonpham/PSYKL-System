import { notImplementedOnline } from './online-path.stub';
import type { UseListsResult } from './useLists';

const NO_LISTS: UseListsResult['lists'] = [];

/**
 * The online-only path for Lists (Offline Mode off). Stubbed: online-offline-modes
 * Spec 3 implements it over TanStack Query against a direct (`offlineCapable:
 * false`) list Service Client shim (DESIGN.md Decision 6). It must not import
 * `useLists.positions` or `useLists.default-list`: both read IndexedDB directly
 * and are sync-path only. Spec 2 moves positions and the default list
 * server-side, so this path never needs them (Decisions 7, 10). Until then it
 * shows no lists and every write rejects.
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
