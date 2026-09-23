import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import { moveItem, targetIndexFor } from './reorder';

interface RowMeasurements {
  ids: string[];
  midpoints: number[];
}

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
  // Row geometry for the drag in progress. Measuring is a forced layout over
  // every open row, so it happens when the order actually changes — not on
  // every pointermove, which fires at the pointer's sampling rate.
  const measured = useRef<RowMeasurements | null>(null);

  const measure = useCallback((): RowMeasurements => {
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-task-id][data-completed="false"]') ?? [])];
    return {
      ids: rows.map((row) => row.dataset.taskId ?? ''),
      midpoints: rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top + rect.height / 2;
      }),
    };
  }, [listRef]);

  const moveTo = useCallback((ids: string[], id: string, to: number): boolean => {
    const from = ids.indexOf(id);
    if (from === -1 || to === from) {
      return false;
    }
    setHandOrder(moveItem(ids, from, to));
    return true;
  }, []);

  const reorder = useCallback(
    (id: string, delta: -1 | 1) => {
      const { ids } = measure();
      moveTo(ids, id, ids.indexOf(id) + delta);
    },
    [measure, moveTo],
  );

  // Pointer events rather than HTML5 drag-and-drop: this is judged on an
  // iPhone, where `dragstart` never fires.
  const startDrag = useCallback(
    (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setDraggingId(id);
      measured.current = measure();

      const onMove = (moveEvent: PointerEvent) => {
        const rows = measured.current ?? measure();
        // Re-measure only when the rows have actually swapped underneath the
        // finger; until then the geometry from the last change still holds.
        if (moveTo(rows.ids, id, targetIndexFor(rows.midpoints, moveEvent.clientY))) {
          measured.current = null;
          requestAnimationFrame(() => {
            measured.current = measure();
          });
        }
      };
      const onEnd = () => {
        setDraggingId(null);
        measured.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [measure, moveTo],
  );

  return { draggingId, handOrder, reorder, startDrag };
}

export { useHandOrder };
