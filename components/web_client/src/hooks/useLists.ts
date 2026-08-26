import { generateKeyBetween } from 'fractional-indexing';
import { useCallback, useSyncExternalStore } from 'react';
import { v7 as uuidv7 } from 'uuid';

import { listLists, putList } from '../db/idb';
import type { ListRecord } from '../db/idb.types';
import { enqueue } from '../sync/replay';
import { getSharedChannel, resetSharedChannelsForTest } from './broadcast-channel';

interface UseListsResult {
  createList(title: string): Promise<ListRecord>;
  lists: ListRecord[];
  moveList(id: string, before: ListRecord | null, after: ListRecord | null): Promise<void>;
  renameList(id: string, title: string): Promise<void>;
}

const channelName = 'psykl-idb';
const messageType = 'lists-changed';
const subscribers = new Set<() => void>();

let broadcastChannel: BroadcastChannel | null = null;
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

  return { createList, lists, moveList, renameList };
}

async function notifyListSubscribers(options: { broadcast?: boolean } = {}): Promise<void> {
  await reloadListsSnapshot();

  if (options.broadcast ?? true) {
    getBroadcastChannel()?.postMessage({ type: messageType });
  }
}

function resetUseListsForTest(): void {
  broadcastChannel = null;
  resetSharedChannelsForTest();
  hydrated = false;
  snapshot = [];
  subscribers.clear();
}

function subscribeToLists(callback: () => void): () => void {
  subscribers.add(callback);
  getBroadcastChannel();
  if (!hydrated) {
    void reloadListsSnapshot();
  }

  return () => {
    subscribers.delete(callback);
  };
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

function getBroadcastChannel(): BroadcastChannel | null {
  if (broadcastChannel || typeof BroadcastChannel === 'undefined') {
    return broadcastChannel;
  }

  const channel = getSharedChannel(channelName);
  if (!channel) {
    return null;
  }

  channel.addEventListener('message', (event) => {
    if ((event.data as { type?: string }).type === messageType) {
      void notifyListSubscribers({ broadcast: false });
    }
  });
  broadcastChannel = channel;

  return broadcastChannel;
}

function setSnapshot(nextSnapshot: ListRecord[]): void {
  snapshot = nextSnapshot;
  subscribers.forEach((callback) => callback());
}

export { resetUseListsForTest, useLists };
