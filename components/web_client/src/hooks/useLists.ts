/* eslint-disable simple-import-sort/imports */
import { useCallback, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import type { ListRecord } from '../db/idb.types';
import { listServiceClient } from '../services/list-service-client';
import { ensureDefaultList, resetDefaultListForTest } from './useLists.default-list';
import { nextListPosition, positionBetween } from './useLists.positions';
/**
 * These should not be here, sync behavior should not be coupled to the UI.
 * But the sync system is still in flux, and this is the simplest way to get the UI to update when tasks change.
 * Once the sync system is more stable, this should be refactored to be more decoupled.
 */
import { enqueueWithReplay } from '../sync/page-triggers';
import { replay } from '../sync/replay';
import {
  getListsSnapshot,
  notifyListSubscribers,
  resetListsSyncForTest,
  subscribeToListChanges,
  subscribeToLists,
} from './useLists.sync';

interface UseListsResult {
  canDelete: boolean;
  createList(title: string): Promise<ListRecord>;
  deleteList(id: string): Promise<void>;
  lists: ListRecord[];
  moveList(id: string, before: ListRecord | null, after: ListRecord | null): Promise<void>;
  renameList(id: string, title: string): Promise<void>;
}

function mutateList<T>(enqueue: () => Promise<T>): Promise<T> {
  return enqueueWithReplay({ enqueue, notify: notifyListSubscribers, replay });
}

function useLists(): UseListsResult {
  const lists = useSyncExternalStore(subscribeToLists, getListsSnapshot);

  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      // The default list is established first, whatever order the user and the
      // bootstrap arrive in: a user who opens the Lists page and adds a list
      // straight away used to write their list first, which made the bootstrap
      // believe this device already had a default list and skip creating one.
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
      return mutateList(() =>
        listServiceClient.create(
          list.id,
          { id: list.id, title: list.title, position: list.position, updated_at: list.updated_at },
          list,
        ),
      );
    },
    [lists],
  );

  const deleteList = useCallback(
    async (id: string): Promise<void> => {
      // The last remaining list can never be deleted (UX.md § 10 decision 1).
      if (lists.length <= 1) {
        return;
      }
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      const deleted_at = new Date().toISOString();
      const optimistic: ListRecord = { ...existing, deleted_at, updated_at: deleted_at };
      await mutateList(() => listServiceClient.delete(id, { deleted_at }, optimistic));
    },
    [lists],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      const updated_at = new Date().toISOString();
      const { position, respaced } = await positionBetween(before, after);
      for (const list of respaced) {
        if (list.id === id) {
          continue;
        }
        await mutateList(() =>
          listServiceClient.patch(list.id, { position: list.position, updated_at }, { ...list, updated_at }),
        );
      }
      const optimistic: ListRecord = { ...existing, position, updated_at };
      await mutateList(() => listServiceClient.patch(id, { position, updated_at }, optimistic));
    },
    [lists],
  );

  const renameList = useCallback(
    async (id: string, title: string): Promise<void> => {
      const updated_at = new Date().toISOString();
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      const optimistic: ListRecord = { ...existing, title, updated_at };
      await mutateList(() => listServiceClient.patch(id, { title, updated_at }, optimistic));
    },
    [lists],
  );

  return { canDelete: lists.length > 1, createList, deleteList, lists, moveList, renameList };
}

function resetUseListsForTest(): void {
  resetDefaultListForTest();
  resetListsSyncForTest();
}

export { notifyListSubscribers, resetUseListsForTest, subscribeToListChanges, useLists };
