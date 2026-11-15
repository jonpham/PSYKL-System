import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, type ReactNode, useCallback, useMemo, useState } from 'react';

import { createServiceClients, ServiceClientsContext } from '../../hooks/useServiceClients';
import { type UserSettings, UserSettingsContext } from '../../hooks/useUserSettings';
import { readOfflineMode, writeOfflineMode } from '../../preferences/offlineMode';

/**
 * Supplies user settings and owns the data-path switch. Children are keyed on
 * Offline Mode, so changing it unmounts and remounts the whole tree: every
 * `use{Entity}()` hook then starts fresh on the new path, which is what makes
 * the seam's branch between two different client hooks safe
 * (online-offline-modes DESIGN.md Decision 3). It also builds the per-mode
 * Service Client shims (Decision 6). With Offline Mode off it also owns the
 * TanStack Query cache the API path reads (Decision 2).
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [offlineMode, setOfflineModeState] = useState(readOfflineMode);

  const setOfflineMode = useCallback((next: boolean) => {
    writeOfflineMode(next);
    setOfflineModeState(next);
  }, []);

  const settings = useMemo<UserSettings>(() => ({ offlineMode, setOfflineMode }), [offlineMode, setOfflineMode]);

  const clients = useMemo(() => createServiceClients(offlineMode), [offlineMode]);

  // One cache per Offline Mode off session: the remount below drops it, so
  // turning the mode off again always starts from what the server says.
  const queryClient = useMemo(
    () => (offlineMode ? null : new QueryClient({ defaultOptions: { queries: { retry: 1 } } })),
    [offlineMode],
  );

  return (
    <UserSettingsContext.Provider value={settings}>
      <ServiceClientsContext.Provider value={clients}>
        <Fragment key={offlineMode ? 'offline' : 'online'}>
          {queryClient ? <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> : children}
        </Fragment>
      </ServiceClientsContext.Provider>
    </UserSettingsContext.Provider>
  );
}
