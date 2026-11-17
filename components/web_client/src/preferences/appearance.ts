import { readDeviceValue, writeDeviceValue } from './deviceStore';

type Appearance = 'dark' | 'light' | 'system';

const APPEARANCE_CHOICES: Appearance[] = ['system', 'light', 'dark'];
const KEY = 'pref:appearance';

/** Appearance is a property of this device, like completed visibility, so it
 * lives in the device store (`deviceStore.ts`) and is never enqueued. `system` means "defer to
 * prefers-color-scheme", which is why it stamps no attribute at all. */
async function readAppearance(): Promise<Appearance> {
  const value = await readDeviceValue(KEY);
  return APPEARANCE_CHOICES.find((choice) => choice === value) ?? 'system';
}

async function writeAppearance(choice: Appearance): Promise<void> {
  await writeDeviceValue(KEY, choice);
}

export { APPEARANCE_CHOICES, readAppearance, writeAppearance };
export type { Appearance };
