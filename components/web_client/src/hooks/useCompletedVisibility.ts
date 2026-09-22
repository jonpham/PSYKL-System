import { useCallback, useEffect, useState } from 'react';

import { readCompletedVisibility, writeCompletedVisibility } from '../preferences/completedVisibility';
import { useActiveListId } from './useActiveList';

interface UseCompletedVisibilityResult {
  setShowCompleted(visible: boolean): void;
  showCompleted: boolean;
}

/** Reads the active list's device-local completed-visibility preference. The
 * default is to show them, so the list never hides work while the preference is
 * still being read. */
function useCompletedVisibility(): UseCompletedVisibilityResult {
  const listId = useActiveListId();
  const [showCompleted, setShowCompletedState] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void readCompletedVisibility(listId).then((visible) => {
      if (!cancelled) {
        setShowCompletedState(visible);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listId]);

  const setShowCompleted = useCallback(
    (visible: boolean) => {
      setShowCompletedState(visible);
      void writeCompletedVisibility(listId, visible);
    },
    [listId],
  );

  return { setShowCompleted, showCompleted };
}

export { useCompletedVisibility };
