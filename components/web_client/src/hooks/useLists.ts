import { generateKeyBetween } from 'fractional-indexing';
import { useCallback, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import { listLists, putList } from '../db/idb';
import type { ListRecord } from '../db/idb.types';
import { enqueue } from '../sync/replay';
import { resetSharedChannelsForTest } from './broadcast-channel';
import { createChannelNotifier } from './broadcast-notify';
import { ensureDefaultList, resetDefaultListForTest } from './useLists.default-list';

interface UseListsResult {
  canDelete: boolean;
  createList(title: string): Promise<ListRecord>;
  deleteList(id: string): Promise<void>;
  lists: ListRecord[];
  moveList(id: string, before: ListRecord | null, after: ListRecord | null): Promise<void>;
  renameList(id: string, title: string): Promise<void>;
}

const subscribers = new Set<() => void>();
const channel = createChannelNotifier('psykl-idb', 'lists-changed', () => {
  void notifyListSubscribers({ broadcast: false });
});

let hydrated = false;
let snapshot: ListRecord[] = [];

function useLists(): UseListsResult {
  const lists = useSyncExternalStore(subscribeToLists, getListsSnapshot);

  const createList = useCallback(
    async (title: string): Promise<ListRecord> => {
      const last = lists.at(-1) ?? null;
      const now = new Date().toISOString();
      const list: ListRecord = {
        id: uuidv7(),
        user_id: 'local',
        title,
        position: generateKeyBetween(last?.position ?? null, null),
        created_at: now,
        updated_at: now,
        server_updated_at: now,
        deleted_at: null,
      };
      await putList(list);
      await enqueue({
        body: { id: list.id, title: list.title, position: list.position, updated_at: list.updated_at },
        entityId: list.id,
        entityType: 'list',
        op: 'create',
      });
      await notifyListSubscribers();
      return list;
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
      await putList({ ...existing, deleted_at, updated_at: deleted_at });
      await enqueue({ body: { deleted_at, updated_at: deleted_at }, entityId: id, entityType: 'list', op: 'delete' });
      await notifyListSubscribers();
    },
    [lists],
  );

  const moveList = useCallback(
    async (id: string, before: ListRecord | null, after: ListRecord | null): Promise<void> => {
      const position = generateKeyBetween(before?.position ?? null, after?.position ?? null);
      const updated_at = new Date().toISOString();
      const existing = lists.find((list) => list.id === id);
      if (!existing) {
        return;
      }
      await putList({ ...existing, position, updated_at });
      await enqueue({ body: { position, updated_at }, entityId: id, entityType: 'list', op: 'patch' });
      await notifyListSubscribers();
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
      await putList({ ...existing, title, updated_at });
      await enqueue({ body: { title, updated_at }, entityId: id, entityType: 'list', op: 'patch' });
      await notifyListSubscribers();
    },
    [lists],
  );

  return { canDelete: lists.length > 1, createList, deleteList, lists, moveList, renameList };
}

async function notifyListSubscribers(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadListsSnapshot();

  if (options.broadcast ?? true) {
    channel.post();
  }
}

function resetUseListsForTest(): void {
  channel.reset();
  resetDefaultListForTest();
  resetSharedChannelsForTest();
  hydrated = false;
  snapshot = [];
  subscribers.clear();
}

function subscribeToLists(callback: () => void): () => void {
  subscribers.add(callback);
  channel.ensureChannel();
  if (!hydrated) {
    void ensureDefaultListThenReload();
  }

  return () => {
    subscribers.delete(callback);
  };
}

async function ensureDefaultListThenReload(): Promise<void> {
  await ensureDefaultList();
  await reloadListsSnapshot();
}

function getListsSnapshot(): ListRecord[] {
  return snapshot;
}

async function reloadListsSnapshot(): Promise<ListRecord[]> {
  const lists = await listLists();
  hydrated = true;
  setSnapshot(lists.filter((list) => list.deleted_at === null));
  return snapshot;
}

function setSnapshot(nextSnapshot: ListRecord[]): void {
  snapshot = nextSnapshot;
  subscribers.forEach((callback) => callback());
}

export { resetUseListsForTest, useLists };
