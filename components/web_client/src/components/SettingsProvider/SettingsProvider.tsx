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
 * Service Client shims (Decision 6).
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [offlineMode, setOfflineModeState] = useState(readOfflineMode);

  const setOfflineMode = useCallback((next: boolean) => {
    writeOfflineMode(next);
    setOfflineModeState(next);
  }, []);

  const settings = useMemo<UserSettings>(() => ({ offlineMode, setOfflineMode }), [offlineMode, setOfflineMode]);

  const clients = useMemo(() => createServiceClients(offlineMode), [offlineMode]);

  return (
    <UserSettingsContext.Provider value={settings}>
      <ServiceClientsContext.Provider value={clients}>
        <Fragment key={offlineMode ? 'offline' : 'online'}>{children}</Fragment>
      </ServiceClientsContext.Provider>
    </UserSettingsContext.Provider>
  );
}
