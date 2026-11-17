import { readDeviceValue, writeDeviceValue } from './deviceStore';

type Contrast = 'increased' | 'standard';

const CONTRAST_CHOICES: Contrast[] = ['standard', 'increased'];
const KEY = 'pref:contrast';

/** Contrast composes with appearance rather than replacing it: four
 * combinations exist, and `increased` stamps `data-contrast` on the root
 * alongside whatever `data-theme` the appearance stamps. Device-local, never
 * enqueued. */
async function readContrast(): Promise<Contrast> {
  const value = await readDeviceValue(KEY);
  return CONTRAST_CHOICES.find((choice) => choice === value) ?? 'standard';
}

async function writeContrast(choice: Contrast): Promise<void> {
  await writeDeviceValue(KEY, choice);
}

export { CONTRAST_CHOICES, readContrast, writeContrast };
export type { Contrast };
