import { useSyncExternalStore } from 'react';

import { experimentToolsStore } from './experimentToolsStore';

/** Whether the floating experiment tools should be rendered over production. */
function useExperimentTools(): boolean {
  return useSyncExternalStore(experimentToolsStore.subscribe, experimentToolsStore.read, () => false);
}

export { useExperimentTools };
