import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { createServiceClients, ServiceClientsContext } from '../hooks/useServiceClients';

/** Renders a hook on the API path: a fresh query cache that never retries,
 * and the direct (`offlineCapable: false`) Service Client shims. */
export function createApiPathWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const clients = createServiceClients(false);
  return function ApiPathWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServiceClientsContext.Provider value={clients}>{children}</ServiceClientsContext.Provider>
      </QueryClientProvider>
    );
  };
}
