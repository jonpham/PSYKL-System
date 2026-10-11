import { notImplementedOnline } from './online-path.stub';
import type { UseListsResult } from './useLists';

const NO_LISTS: UseListsResult['lists'] = [];

/**
 * The online-only path for Lists (Offline Mode off). Stubbed: online-offline-modes
 * Spec 2 implements it over TanStack Query against a direct (`offlineCapable:
 * false`) list Service Client, reusing the path-independent rules — last list
 * cannot be deleted, positions from `useLists.positions` (DESIGN.md Decisions
 * 6-7). Until then it shows no lists and every write rejects.
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
