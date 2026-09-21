import { useEffect, useState } from 'react';

/** The app has no router. This is the minimum needed to put the experiment
 * sandbox on its own path without committing the production shell to a routing
 * library before that decision is actually made. */
function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return pathname;
}

/** `pushState` alone does not notify listeners, so the event is dispatched
 * explicitly to keep `usePathname` in sync with programmatic navigation. */
function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export { navigate, usePathname };
