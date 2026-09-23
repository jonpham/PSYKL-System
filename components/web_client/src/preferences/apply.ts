import type { Appearance } from './appearance';
import type { Contrast } from './contrast';

type IconTheme = 'dark' | 'light';

/** The two home-screen tiles `scripts/generate-icons.mjs` renders. */
const APP_ICON_HREF: Record<IconTheme, string> = {
  dark: '/apple-touch-icon-dark.png',
  light: '/apple-touch-icon.png',
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches;
}

/** `system` means "whatever the device is showing right now" — the same rule
 * the token sheet applies by stamping no `data-theme` at all. */
function resolveIconTheme(appearance: Appearance): IconTheme {
  if (appearance === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return appearance;
}

/**
 * iOS bakes the home-screen icon at Add to Home Screen time, reading the
 * `apple-touch-icon` link out of the live document. Pointing that link at the
 * tile matching the appearance in force is therefore the only way a web app
 * gets a say in its installed icon — there is no dark variant Safari resolves
 * on its own. An icon already on the home screen never changes; the user has
 * to remove and re-add it.
 */
function applyAppIcon(appearance: Appearance): void {
  const link = document.querySelector('link[rel="apple-touch-icon"]');
  link?.setAttribute('href', APP_ICON_HREF[resolveIconTheme(appearance)]);
}

/** Reflects the stored preferences onto the document: the token sheet switches
 * on these attributes, and contrast composes with whichever appearance is in
 * force. */
function applyPreferences(appearance: Appearance, contrast: Contrast): void {
  const root = document.documentElement;
  if (appearance === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', appearance);
  }
  if (contrast === 'increased') {
    root.setAttribute('data-contrast', 'increased');
  } else {
    root.removeAttribute('data-contrast');
  }
  applyAppIcon(appearance);
}

/**
 * Keeps the icon honest while the app sits open under `system`: the device can
 * flip appearance on a schedule, and the next Add to Home Screen should get
 * the tile the user is actually looking at. Returns a teardown.
 */
function watchSystemAppearance(onChange: () => void): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export { APP_ICON_HREF, applyAppIcon, applyPreferences, resolveIconTheme, watchSystemAppearance };
export type { IconTheme };
