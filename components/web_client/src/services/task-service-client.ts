import type { Task, TaskDeleteInput, TaskInput, TaskPatchInput } from '../api/client';
import {
  createTaskRemote,
  deleteTaskRemote,
  listTasksRemote,
  patchTaskRemote,
  restoreTaskRemote,
} from '../api/tasks.api-client';
import { listTasks, putTask } from '../db/idb';
import { createSyncClient, resetSyncClientHydrationForTest } from '../sync/sync-client';
import { createServiceClient, type EntityApiClient, type ServiceClient } from './service-client';

const taskApiClient: EntityApiClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput> = {
  create: createTaskRemote,
  delete: deleteTaskRemote,
  list: listTasksRemote,
  patch: patchTaskRemote,
  restore: restoreTaskRemote,
};

const taskSyncClient = createSyncClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>({
  entityType: 'task',
  listLocal: listTasks,
  listRemote: listTasksRemote,
  put: putTask,
});

type TaskServiceClient = ServiceClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>;

/** The inner clients above are the singletons; this shim is rebuilt per
 * Offline Mode (DESIGN.md Decision 6). */
function createTaskServiceClient(offlineCapable: boolean): TaskServiceClient {
  return createServiceClient({ apiClient: taskApiClient, offlineCapable, syncClient: taskSyncClient });
}

function resetTaskServiceClientForTest(): void {
  resetSyncClientHydrationForTest(taskSyncClient);
}

export { createTaskServiceClient, resetTaskServiceClientForTest };
export type { TaskServiceClient };
