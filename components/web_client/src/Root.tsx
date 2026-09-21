import App from './App';
import { ExperimentRouter, isExperimentPath } from './experiment';
import { usePathname } from './hooks/usePathname';

/** Picks the surface for the current path: the production app, or the
 * experiment sandbox. The only place production rendering and experimental
 * rendering meet. */
export function Root() {
  const pathname = usePathname();

  if (isExperimentPath(pathname)) {
    return <ExperimentRouter pathname={pathname} />;
  }

  return <App />;
}
