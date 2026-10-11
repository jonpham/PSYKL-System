import { notImplementedOnline } from './online-path.stub';
import type { UseTasksResult } from './useTasks';

const NO_TASKS: UseTasksResult['tasks'] = [];

/**
 * The online-only path for Tasks (Offline Mode off). Stubbed: online-offline-modes
 * Spec 2 implements it over TanStack Query against a direct (`offlineCapable:
 * false`) task Service Client (DESIGN.md Decision 6). Until then it shows an
 * empty, loaded list and every write rejects.
 */
function useTasksApiClient(): UseTasksResult {
  return {
    createTask: () => notImplementedOnline('createTask'),
    deleteTask: () => notImplementedOnline('deleteTask'),
    error: null,
    loading: false,
    patchTask: () => notImplementedOnline('patchTask'),
    tasks: NO_TASKS,
  };
}

export { useTasksApiClient };
