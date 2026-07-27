import { useEffect, useState } from 'react';

/**
 * Returns `true` only after `active` has stayed true continuously for
 * `delayMs`. If `active` flips false before the delay elapses, the flag never
 * turns on — so brief blips (e.g. a fast online sync) never surface it.
 */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return shown;
}
