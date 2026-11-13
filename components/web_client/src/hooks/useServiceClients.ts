import { createContext, useContext } from 'react';

import { createListServiceClient, type ListServiceClient } from '../services/list-service-client';
import { createTaskServiceClient, type TaskServiceClient } from '../services/task-service-client';

interface ServiceClients {
  lists: ListServiceClient;
  tasks: TaskServiceClient;
}

function createServiceClients(offlineMode: boolean): ServiceClients {
  return { lists: createListServiceClient(offlineMode), tasks: createTaskServiceClient(offlineMode) };
}

/** Trees without a `SettingsProvider` (unit tests, stories) get the sync
 * path, matching `UserSettingsContext`'s default (DESIGN.md Decisions 3, 6). */
const ServiceClientsContext = createContext<ServiceClients>(createServiceClients(true));

function useServiceClients(): ServiceClients {
  return useContext(ServiceClientsContext);
}

export { createServiceClients, ServiceClientsContext, useServiceClients };
export type { ServiceClients };
