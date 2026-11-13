import './settings-view.css';

import { useEffect, useRef } from 'react';

import { ExperimentsIndex } from '../../experiment';
import { ONLINE_PATH_AVAILABLE } from '../../hooks/online-path.stub';
import { useAppearance } from '../../hooks/useAppearance';
import { useUserSettings } from '../../hooks/useUserSettings';
import { type Appearance, APPEARANCE_CHOICES } from '../../preferences/appearance';
import { type Contrast, CONTRAST_CHOICES } from '../../preferences/contrast';
import { AppVersion } from '../AppVersion';

const appearanceLabels: Record<Appearance, string> = { dark: 'Dark', light: 'Light', system: 'System' };
const contrastLabels: Record<Contrast, string> = { increased: 'Increased', standard: 'Standard' };

// Changing Offline Mode remounts the whole tree (DESIGN.md Decision 3), so the
// switch the user just pressed is replaced by a new node. This one-shot flag
// survives the remount and hands focus to the new switch, so a keyboard or
// screen-reader user is not dropped back to the top of the page.
let refocusOfflineModeSwitch = false;

export function SettingsView() {
  const { appearance, contrast, setAppearance, setContrast } = useAppearance();
  const { offlineMode, setOfflineMode } = useUserSettings();
  const offlineModeSwitch = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (refocusOfflineModeSwitch) {
      refocusOfflineModeSwitch = false;
      offlineModeSwitch.current?.focus();
    }
  }, []);

  return (
    <div className="psykl-settings">
      <section aria-label="Appearance" className="psykl-settings__section">
        <h3>Appearance</h3>
        <div className="psykl-settings__segmented" role="radiogroup" aria-label="Appearance">
          {APPEARANCE_CHOICES.map((choice) => (
            <button
              aria-checked={appearance === choice}
              className="psykl-settings__segment"
              key={choice}
              onClick={() => setAppearance(choice)}
              role="radio"
              type="button"
            >
              {appearanceLabels[choice]}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Contrast" className="psykl-settings__section">
        <h3>Contrast</h3>
        <div className="psykl-settings__segmented" role="radiogroup" aria-label="Contrast">
          {CONTRAST_CHOICES.map((choice) => (
            <button
              aria-checked={contrast === choice}
              className="psykl-settings__segment"
              key={choice}
              onClick={() => setContrast(choice)}
              role="radio"
              type="button"
            >
              {contrastLabels[choice]}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Data" className="psykl-settings__section">
        <h3>Data</h3>
        <div className="psykl-settings__row">
          <span id="psykl-settings-offline-mode">Offline Mode</span>
          <button
            aria-checked={offlineMode}
            aria-labelledby="psykl-settings-offline-mode"
            className="psykl-settings__switch"
            data-available={String(ONLINE_PATH_AVAILABLE)}
            onClick={() => {
              refocusOfflineModeSwitch = true;
              setOfflineMode(!offlineMode);
            }}
            ref={offlineModeSwitch}
            role="switch"
            type="button"
          />
        </div>
        <p>Keep a copy on this device and sync when online.</p>
      </section>

      <section aria-label="Experiments" className="psykl-settings__section">
        <h3>Experiments</h3>
        <p>Prototypes under evaluation. They are throwaway and may disappear without notice.</p>
        <ExperimentsIndex />
      </section>
      <section aria-label="About" className="psykl-settings__section">
        <h3>About</h3>
        <AppVersion />
      </section>
    </div>
  );
}
