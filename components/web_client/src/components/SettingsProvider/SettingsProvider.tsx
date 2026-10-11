import { Fragment, type ReactNode, useCallback, useMemo, useState } from 'react';

import { type UserSettings, UserSettingsContext } from '../../hooks/useUserSettings';
import { readOfflineMode, writeOfflineMode } from '../../preferences/offlineMode';

/**
 * Supplies user settings and owns the data-path switch. Children are keyed on
 * Offline Mode, so changing it unmounts and remounts the whole tree: every
 * `use{Entity}()` hook then starts fresh on the new path, which is what makes
 * the seam's branch between two different client hooks safe
 * (online-offline-modes DESIGN.md Decision 3).
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [offlineMode, setOfflineModeState] = useState(readOfflineMode);

  const setOfflineMode = useCallback((next: boolean) => {
    writeOfflineMode(next);
    setOfflineModeState(next);
  }, []);

  const settings = useMemo<UserSettings>(() => ({ offlineMode, setOfflineMode }), [offlineMode, setOfflineMode]);

  return (
    <UserSettingsContext.Provider value={settings}>
      <Fragment key={offlineMode ? 'offline' : 'online'}>{children}</Fragment>
    </UserSettingsContext.Provider>
  );
}
