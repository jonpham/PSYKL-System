import { createContext, useContext } from 'react';

interface UserSettings {
  offlineMode: boolean;
  setOfflineMode(offlineMode: boolean): void;
}

/** The default is what every tree without a `SettingsProvider` sees — unit
 * tests and stories rendering a hook or component on its own — so it must be
 * the sync path, the app's default. */
const UserSettingsContext = createContext<UserSettings>({
  offlineMode: true,
  setOfflineMode: () => {},
});

function useUserSettings(): UserSettings {
  return useContext(UserSettingsContext);
}

export { UserSettingsContext, useUserSettings };
export type { UserSettings };
