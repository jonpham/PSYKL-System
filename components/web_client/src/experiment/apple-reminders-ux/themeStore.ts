type ThemeChoice = 'dark' | 'light' | 'system';

const KEY = 'reminders-exp:theme';
const CHOICES: ThemeChoice[] = ['system', 'light', 'dark'];

/** Appearance is a property of this device, like the show-completed toggle, so
 * it lives in localStorage and is never synced. `system` means "defer to
 * prefers-color-scheme", which is why it stamps no attribute at all. */
const themeStore = {
  read(): ThemeChoice {
    try {
      const stored = window.localStorage.getItem(KEY);
      return CHOICES.find((choice) => choice === stored) ?? 'system';
    } catch {
      return 'system';
    }
  },

  write(choice: ThemeChoice): void {
    try {
      window.localStorage.setItem(KEY, choice);
    } catch {
      // A preference we cannot persist is not worth failing the interaction for.
    }
  },
};

export { CHOICES as THEME_CHOICES, themeStore };
export type { ThemeChoice };
