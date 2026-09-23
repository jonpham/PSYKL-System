import App from './App';
import { ExperimentRouter, ExperimentTools, isExperimentPath, useExperimentTools } from './experiment';
import { usePathname } from './hooks/usePathname';

/** Picks the surface for the current path: the production app, or the
 * experiment sandbox. The only place production rendering and experimental
 * rendering meet. The experiment tools ride along over production only once a
 * developer has opened an experiment on this device. */
export function Root() {
  const pathname = usePathname();
  const toolsOn = useExperimentTools();

  if (isExperimentPath(pathname)) {
    return <ExperimentRouter pathname={pathname} />;
  }

  return (
    <>
      <App />
      {toolsOn ? <ExperimentTools /> : null}
    </>
  );
}
