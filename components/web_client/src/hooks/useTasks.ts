import type { Task, TaskDeleteInput, TaskPatchInput } from '../api/client';
import { useTasksApiClient } from './useTasks.api';
import { type TasksSnapshot, useTasksSyncClient } from './useTasks.sync';
import { useUserSettings } from './useUserSettings';

interface UseTasksResult extends TasksSnapshot {
  createTask(title: string): Promise<Task>;
  deleteTask(id: string, body: TaskDeleteInput, optimistic: Task): Promise<void>;
  patchTask(id: string, body: TaskPatchInput, optimistic: Task): Promise<Task>;
}

/**
 * The data-path seam for Tasks (online-offline-modes DESIGN.md Decision 1);
 * see `useLists` for why branching between two hooks is safe here.
 */
function useTasks(): UseTasksResult {
  const { offlineMode } = useUserSettings();
  return offlineMode ? useTasksSyncClient() : useTasksApiClient();
}

// Sync-store helpers re-exported so existing importers keep working; they move
// to their sync-only consumers when sync goes behind services (Decision 8).
export { notifyTasksChanged, resetUseTasksForTest, subscribeToTaskChanges } from './useTasks.sync';
export { useTasks };
export type { UseTasksResult };
