import { readAppearance } from './appearance';
import { applyAppIcon, applyPreferences, watchSystemAppearance } from './apply';
import { readContrast } from './contrast';

/**
 * Reflects the stored device preferences onto the document as the app starts.
 *
 * Until this existed, `data-theme` was only stamped when `SettingsView`
 * mounted, so a saved Dark appearance was ignored on every load until the user
 * happened to open Settings. The home-screen icon has the same requirement and
 * a stricter one: Add to Home Screen can happen at any moment, so the
 * `apple-touch-icon` link has to be correct from startup, not from first
 * navigation.
 */
async function applyStoredPreferences(): Promise<() => void> {
  const [appearance, contrast] = await Promise.all([readAppearance(), readContrast()]);
  applyPreferences(appearance, contrast);
  // Re-read on each system flip rather than closing over the value above,
  // which Settings may since have replaced.
  return watchSystemAppearance(() => void readAppearance().then(applyAppIcon));
}

export { applyStoredPreferences };
