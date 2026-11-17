import { useQuery, useQueryClient } from '@tanstack/react-query';
import { generateKeyBetween } from 'fractional-indexing';
import { useCallback, useMemo } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { ListRecord } from '../db/idb.types';
import { isDefaultList } from '../services/default-list';
import { LISTS_QUERY_KEY, RECENTLY_DELETED_QUERY_KEY } from './query-keys';
import type { UseListsResult } from './useLists';
import { useServiceClients } from './useServiceClients';

const NO_LISTS: ListRecord[] = [];

/**
 * The online-only path for Lists (Offline Mode off). The server is the source
 * of truth and TanStack Query's cache is the only copy (DESIGN.md Decision 2).
 * Every write waits for the server, then puts the server's answer in the cache,
 * so the user only ever sees what the server holds (Spec 3 decision S3-2). The
 * server picks a new list's position (Decision 10); a move computes the key
 * between the two neighbours it is given (S3-3). Must not import
 * useLists.positions or useLists.default-list, which read IndexedDB (Decision 7).
 */
function useListsApiClient(): UseListsResult {
  const { lists: listServiceClient } = useServiceClients();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryFn: () => listServiceClient.list(), queryKey: LISTS_QUERY_KEY });
  const lists = useMemo(() => (data ? visibleLists(data) : NO_LISTS), [data]);

  const store = useCallback(
    (saved: ListRecord) => {
      queryClient.setQueryData<ListRecord[]>(LISTS_QUERY_KEY, (current = []) =>
        visibleLists([...current.filter((item) => item.id !== saved.id), saved]),
      );
    },
    [queryClient],
  );

  const canDeleteList = useCallback((id: string) => lists.length > 1 && !isDefaultList(id), [lists]);

  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      const id = uuidv7();
      const now = new Date().toISOString();
      // The direct shim sends only `body`; the optimistic record is a sync-path
      // argument, so its empty position is never stored or shown.
      const optimistic: ListRecord = {
        created_at: now,
        deleted_at: null,
        id,
        position: '',
        server_updated_at: now,
        title,
        updated_at: now,
        user_id: 'local',
      };
      const saved = await listServiceClient.create(id, { id, title, updated_at: now }, optimistic);
      store(saved);
      return saved;
    },
    [listServiceClient, store],
  );

  const deleteList = useCallback(
    async (id: string, deletedAt?: string): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing || !canDeleteList(id)) {
        return;
      }
      const deleted_at = deletedAt ?? new Date().toISOString();
      const deleted: ListRecord = { ...existing, deleted_at, updated_at: deleted_at };
      await listServiceClient.delete(id, { deleted_at }, deleted);
      store(deleted);
      void queryClient.invalidateQueries({ queryKey: RECENTLY_DELETED_QUERY_KEY });
    },
    [canDeleteList, listServiceClient, lists, queryClient, store],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing) {
        return;
      }
      // Throws when the neighbours are not in order; the caller logs it.
      const position = generateKeyBetween(before?.position ?? null, after?.position ?? null);
      const updated_at = new Date().toISOString();
      store(await listServiceClient.patch(id, { position, updated_at }, { ...existing, position, updated_at }));
    },
    [listServiceClient, lists, store],
  );

  const renameList = useCallback(
    async (id: string, title: string): Promise<void> => {
      const existing = lists.find((item) => item.id === id);
      if (!existing) {
        return;
      }
      const updated_at = new Date().toISOString();
      store(await listServiceClient.patch(id, { title, updated_at }, { ...existing, title, updated_at }));
    },
    [listServiceClient, lists, store],
  );

  return { canDeleteList, createList, deleteList, lists, moveList, renameList };
}

/** Open lists in position order; positions compare as plain strings, matching
 * the server's `COLLATE "C"`. */
function visibleLists(lists: ListRecord[]): ListRecord[] {
  return lists
    .filter((item) => item.deleted_at === null)
    .sort((left, right) => (left.position < right.position ? -1 : left.position > right.position ? 1 : 0));
}

export { useListsApiClient };
