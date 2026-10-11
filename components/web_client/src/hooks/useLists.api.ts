/* eslint-disable max-lines */
import { useCallback } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { ListRecord } from '../db/idb.types';
import { listServiceClient } from '../services/list-service-client';
import type { UseListsResult } from './useLists';
import { ensureDefaultList } from './useLists.default-list';
import { nextListPosition, positionBetween } from './useLists.positions';

function useListsApiClient(): UseListsResult {
  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      await ensureDefaultList();
      const now = new Date().toISOString();
      const list: ListRecord = {
        id: uuidv7(),
        user_id: 'local',
        title,
        position: await nextListPosition(),
        created_at: now,
        updated_at: now,
        server_updated_at: now,
        deleted_at: null,
      };
      return listServiceClient.create(
          list.id,
          { id: list.id, title: list.title, position: list.position, updated_at: list.updated_at },
          list,
        );
    },
    [],
  );

  const deleteList = useCallback(
    async (id: string, deletedAt?: string): Promise<void> => {
      // A caller deleting the list's tasks alongside it passes their shared
      // timestamp, which is what pairs them in Recently Deleted (useListDeletion).
      const deleted_at = deletedAt ?? new Date().toISOString();
      await listServiceClient.delete(id, { deleted_at }, []);
    },
    [],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {;
    },
    [lists],
  );

  const renameList = useCallback(
    async (id: string, title: string): Promise<void> => {
      const updated_at = new Date().toISOString();
    },
    [lists],
  );

  return { canDelete: lists.length > 1, createList, deleteList, lists, moveList, renameList };
}

export { useListsApiClient };