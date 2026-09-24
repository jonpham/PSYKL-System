import type { RefObject } from 'react';
import { useRef } from 'react';

import { settleVerdict } from '../../../hooks/swipeTrack';
import { useSwipeTrack } from '../../../hooks/useSwipeTrack';

/** Fraction of the row's width a swipe must cross for the rail to stay open. */
const RAIL_OPEN_FRACTION = 0.25;

/** Fraction of the row's width past which releasing performs the action
 * instead — far enough that it cannot be reached by aiming at the rail. */
const RAIL_COMMIT_FRACTION = 0.6;

interface RowSwipe {
  /** Performed when the finger lifts past the commit threshold — the same
   * delete the rail's button performs. */
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface Widths {
  rail: number;
  row: number;
}

interface UseRowSwipeOptions {
  enabled: boolean;
  railRef: RefObject<HTMLDivElement | null>;
  rowRef: RefObject<HTMLLIElement | null>;
  swipe: RowSwipe | undefined;
}

interface RowSwipeState {
  /** The release would delete: the commit pane takes the whole row. */
  committing: boolean;
  /** Where the surface sits under the finger; undefined hands it back to CSS. */
  offset: number | undefined;
  onPointerDown: ReturnType<typeof useSwipeTrack>['onPointerDown'];
  tracking: boolean;
}

/**
 * The row half of the swipe: measuring, placing the surface, and turning a
 * release into open, closed, or deleted.
 *
 * Widths are measured once per swipe and forgotten when it ends, so every
 * swipe starts from the row's current size without paying a layout per move.
 * Travel is counted from the row's closed position and is positive leftwards,
 * which is why both the delta and the velocity arrive negated.
 */
function useRowSwipe({ enabled, railRef, rowRef, swipe }: UseRowSwipeOptions): RowSwipeState {
  // Measured once when a swipe is claimed and held until it ends. Reading a
  // width after the surface has moved forces the browser to lay the page out
  // again, so reading on every move would cost a layout per frame.
  const measured = useRef<Widths | null>(null);
  const widths = (): Widths =>
    (measured.current ??= {
      rail: railRef.current?.offsetWidth ?? 0,
      row: rowRef.current?.offsetWidth ?? 0,
    });

  const { delta, onPointerDown, tracking } = useSwipeTrack({
    enabled,
    onRelease: ({ delta: released, velocity }) => {
      if (!swipe) return;
      const { rail, row } = widths();
      const verdict = settleVerdict({
        commitAt: row * RAIL_COMMIT_FRACTION,
        openAt: row * RAIL_OPEN_FRACTION,
        travel: (swipe.open ? rail : 0) - released,
        velocity: -velocity,
      });
      if (verdict === 'commit') {
        swipe.onOpenChange(false);
        swipe.onDelete();
        return;
      }
      swipe.onOpenChange(verdict === 'open');
    },
  });

  // Released before the verdict re-renders the row, so the next swipe measures
  // afresh — a rotation between swipes changes both widths.
  if (!tracking) measured.current = null;
  const { rail: railWidth, row: rowWidth } = swipe && tracking ? widths() : { rail: 0, row: 0 };
  const travelled = (swipe?.open ? -railWidth : 0) + delta;

  return {
    committing: tracking && rowWidth > 0 && -travelled >= rowWidth * RAIL_COMMIT_FRACTION,
    offset: tracking ? Math.min(0, Math.max(-rowWidth, travelled)) : undefined,
    onPointerDown,
    tracking,
  };
}

export { type RowSwipe, useRowSwipe };
