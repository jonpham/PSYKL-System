import { getMeta, putMeta } from '../db/idb';

type Appearance = 'dark' | 'light' | 'system';

const APPEARANCE_CHOICES: Appearance[] = ['system', 'light', 'dark'];
const KEY = 'pref:appearance';

/** Appearance is a property of this device, like completed visibility, so it
 * lives in `sync_meta` and is never enqueued. `system` means "defer to
 * prefers-color-scheme", which is why it stamps no attribute at all. */
async function readAppearance(): Promise<Appearance> {
  const entry = await getMeta(KEY);
  return APPEARANCE_CHOICES.find((choice) => choice === entry?.value) ?? 'system';
}

async function writeAppearance(choice: Appearance): Promise<void> {
  await putMeta({ key: KEY, value: choice });
}

export { APPEARANCE_CHOICES, readAppearance, writeAppearance };
export type { Appearance };
