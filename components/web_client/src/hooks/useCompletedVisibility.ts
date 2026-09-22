import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { readCompletedVisibility, writeCompletedVisibility } from '../preferences/completedVisibility';
import { useActiveListId } from './useActiveList';

interface UseCompletedVisibilityResult {
  setShowCompleted(visible: boolean): void;
  showCompleted: boolean;
}

// Module-level, like useActiveList: the header's menu and the list itself both
// read this preference, and a per-hook useState would let the two disagree
// until the next reload.
const subscribers = new Set<() => void>();
const visibilityByList = new Map<string, boolean>();

function notify(): void {
  for (const subscriber of subscribers) {
    subscriber();
  }
}

function subscribe(listener: () => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function snapshotFor(listId: string | null): boolean {
  // Shows completed tasks by default, including while the stored preference is
  // still being read, so the list never briefly hides a user's work.
  return listId === null ? true : (visibilityByList.get(listId) ?? true);
}

function resetCompletedVisibilityForTest(): void {
  visibilityByList.clear();
  subscribers.clear();
}

function useCompletedVisibility(): UseCompletedVisibilityResult {
  const listId = useActiveListId();
  const showCompleted = useSyncExternalStore(
    subscribe,
    () => snapshotFor(listId),
    () => true,
  );

  useEffect(() => {
    if (listId === null || visibilityByList.has(listId)) {
      return;
    }
    let cancelled = false;
    void readCompletedVisibility(listId).then((visible) => {
      if (!cancelled) {
        visibilityByList.set(listId, visible);
        notify();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const setShowCompleted = useCallback(
    (visible: boolean) => {
      if (listId === null) {
        return;
      }
      visibilityByList.set(listId, visible);
      notify();
      void writeCompletedVisibility(listId, visible);
    },
    [listId],
  );

  return { setShowCompleted, showCompleted };
}

export { resetCompletedVisibilityForTest, useCompletedVisibility };
