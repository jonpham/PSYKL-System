import type { Task, TaskDeleteInput, TaskInput, TaskPatchInput } from '../api/client';
import {
  createTaskRemote,
  deleteTaskRemote,
  listTasksRemote,
  patchTaskRemote,
  restoreTaskRemote,
} from '../api/tasks.api-client';
import { listTasks, putTask } from '../db/idb';
import { createSyncClient } from '../sync/sync-client';
import { createServiceClient, type EntityApiClient } from './service-client';

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

const taskServiceClient = createServiceClient<Task, TaskInput, TaskPatchInput, TaskDeleteInput>({
  apiClient: taskApiClient,
  offlineCapable: true,
  syncClient: taskSyncClient,
});

export { taskServiceClient };
