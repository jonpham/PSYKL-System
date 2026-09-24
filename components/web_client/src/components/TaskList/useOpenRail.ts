import { useEffect, useState } from 'react';

interface OpenRail {
  /** The task whose actions are revealed, or null when none are. */
  openRailId: string | null;
  setOpenRailId: (id: string | null) => void;
}

/**
 * Which row has its swipe actions open, for a whole list.
 *
 * It lives above the rows because "open this one" and "close the other one"
 * are the same event: two rails open at once would leave the user with two
 * Deletes on screen and no way to tell which gesture armed which.
 *
 * Scrolling closes it — an open rail is anchored to where the finger was, not
 * to where the list now is — and so does selection mode, which takes that
 * column for the drag handle and leaves no rail to be open.
 */
function useOpenRail(selecting: boolean): OpenRail {
  const [openRailId, setOpenRailId] = useState<string | null>(null);

  useEffect(() => {
    if (openRailId === null) return;
    if (selecting) {
      setOpenRailId(null);
      return;
    }
    const close = () => setOpenRailId(null);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [openRailId, selecting]);

  return { openRailId, setOpenRailId };
}

export { useOpenRail };
