import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import { settleVerdict } from '../../hooks/swipeTrack';
import { useSwipeTrack } from '../../hooks/useSwipeTrack';

/** How far in from the left of the viewport a drag may start and still mean
 * "open the sidebar". Wide enough for a thumb, narrow enough that it never
 * takes a gesture aimed at a task row. */
const EDGE_ZONE_PX = 24;

/** Fraction of the sidebar's own width a drag must cross to settle open. */
const SETTLE_FRACTION = 0.4;

interface UseSidebarSwipeOptions {
  asideRef: RefObject<HTMLElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** The header button, which the wide layout hides. Its visibility is how the
   * shell knows whether a sidebar that can be opened at all is on screen. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

interface SidebarSwipe {
  /** Attach to the shell: starts a gesture only from the left edge. */
  onLayoutPointerDown: (event: ReactPointerEvent) => void;
  /** Attach to the sidebar: a drag anywhere on it closes it. */
  onSidebarPointerDown: (event: ReactPointerEvent) => void;
  /** 0 shut, 1 fully open — what the backdrop fades against. */
  progress: number;
  /** How far the sidebar is drawn from its shut position, as a CSS length. */
  shift: string;
  sliding: boolean;
}

/**
 * Opening and closing the sidebar with a drag.
 *
 * Only the narrow layout has one: past 768px the sidebar is permanent and the
 * gesture would have nothing to do. On iOS the same edge is Safari's own
 * back-swipe, so in a browser tab the two compete — an installed PWA, which is
 * what this is built for, has no back gesture to compete with.
 *
 * Neither direction is the only way: the header button opens it and the
 * backdrop and Escape both close it, unchanged.
 */
function useSidebarSwipe({ asideRef, open, setOpen, triggerRef }: UseSidebarSwipeOptions): SidebarSwipe {
  const narrow = () => triggerRef.current?.offsetParent != null;
  const width = () => asideRef.current?.offsetWidth ?? 0;

  const { delta, onPointerDown, tracking } = useSwipeTrack({
    onRelease: ({ delta: released, velocity }) => {
      const full = width();
      setOpen(
        settleVerdict({
          openAt: full * SETTLE_FRACTION,
          travel: (open ? full : 0) + released,
          velocity,
        }) === 'open',
      );
    },
  });

  const full = tracking ? width() : 0;
  const travel = tracking ? Math.min(full, Math.max(0, (open ? full : 0) + delta)) : null;

  return {
    onLayoutPointerDown: (event) => {
      if (open || !narrow() || event.clientX > EDGE_ZONE_PX) return;
      onPointerDown(event);
    },
    onSidebarPointerDown: (event) => {
      if (!open || !narrow()) return;
      onPointerDown(event);
    },
    progress: travel === null ? (open ? 1 : 0) : full > 0 ? travel / full : 0,
    shift: travel === null ? (open ? '100%' : '0px') : `${travel}px`,
    sliding: tracking,
  };
}

export { useSidebarSwipe };
