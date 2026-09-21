import './settings-view.css';

import { VersionFooter } from '../../../components/VersionFooter';
import { ExperimentsIndex } from '../../ExperimentsIndex';
import { THEME_CHOICES, type ThemeChoice } from '../themeStore';

interface SettingsViewProps {
  onThemeChange: (theme: ThemeChoice) => void;
  theme: ThemeChoice;
}

const LABELS: Record<ThemeChoice, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

export function SettingsView({ onThemeChange, theme }: SettingsViewProps) {
  return (
    <section className="reminders-settings">
      <h3 className="reminders-settings__heading">Appearance</h3>
      {/* System defers to the OS, which is what the shell did before there was
       * any way to say otherwise — so it stays the default. */}
      <div aria-label="Appearance" className="reminders-settings__segmented" role="radiogroup">
        {THEME_CHOICES.map((choice) => (
          <button
            aria-checked={theme === choice}
            className="reminders-settings__segment"
            key={choice}
            onClick={() => onThemeChange(choice)}
            role="radio"
            type="button"
          >
            {LABELS[choice]}
          </button>
        ))}
      </div>

      <h3 className="reminders-settings__heading">Experiments</h3>
      <p className="reminders-settings__note">Prototypes under evaluation. They may disappear without notice.</p>
      <ExperimentsIndex />
      <h3 className="reminders-settings__heading">About</h3>
      <VersionFooter />
    </section>
  );
}
