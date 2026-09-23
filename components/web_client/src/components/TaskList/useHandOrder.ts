import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useState } from 'react';

import { moveItem, targetIndexFor } from './reorder';

interface HandOrder {
  /** The row currently under the user's finger, if any. */
  draggingId: string | null;
  /** Ids in the order the user arranged them; empty until the first move. */
  handOrder: string[];
  /** Keyboard equivalent of a drag: one row up or down. */
  reorder: (id: string, delta: -1 | 1) => void;
  startDrag: (id: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
}

/**
 * Hand ordering of the open tasks, held in React state.
 *
 * This iteration deliberately does not persist it: the operator is judging the
 * interaction before `Task.position` is designed, so a drag survives re-renders
 * and re-sorts but not a reload. See the feature's implementation-notes.md
 * (operator decision, 2026-09-22) — the persisted version mirrors List
 * ordering's fractional index.
 *
 * Both moves read the open rows from the DOM rather than from a render
 * snapshot, so the order acted on is always the order on screen.
 */
function useHandOrder(listRef: RefObject<HTMLUListElement | null>): HandOrder {
  const [handOrder, setHandOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const openIds = useCallback((): string[] => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-id][data-completed="false"]');
    return [...(rows ?? [])].map((row) => row.dataset.taskId ?? '');
  }, [listRef]);

  const moveTo = useCallback(
    (id: string, to: number) => {
      const ids = openIds();
      const from = ids.indexOf(id);
      if (from === -1 || to === from) return;
      setHandOrder(moveItem(ids, from, to));
    },
    [openIds],
  );

  const reorder = useCallback(
    (id: string, delta: -1 | 1) => {
      moveTo(id, openIds().indexOf(id) + delta);
    },
    [moveTo, openIds],
  );

  // Pointer events rather than HTML5 drag-and-drop: this is judged on an
  // iPhone, where `dragstart` never fires.
  const startDrag = useCallback(
    (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setDraggingId(id);

      const onMove = (moveEvent: PointerEvent) => {
        const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-id][data-completed="false"]');
        const midpoints = [...(rows ?? [])].map((row) => {
          const rect = row.getBoundingClientRect();
          return rect.top + rect.height / 2;
        });
        moveTo(id, targetIndexFor(midpoints, moveEvent.clientY));
      };
      const onEnd = () => {
        setDraggingId(null);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [listRef, moveTo],
  );

  return { draggingId, handOrder, reorder, startDrag };
}

export { useHandOrder };
