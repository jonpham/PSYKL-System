import { getMeta, putMeta } from '../db/idb';

type Contrast = 'increased' | 'standard';

const CONTRAST_CHOICES: Contrast[] = ['standard', 'increased'];
const KEY = 'pref:contrast';

/** Contrast composes with appearance rather than replacing it: four
 * combinations exist, and `increased` stamps `data-contrast` on the root
 * alongside whatever `data-theme` the appearance stamps. Device-local, never
 * enqueued. */
async function readContrast(): Promise<Contrast> {
  const entry = await getMeta(KEY);
  return CONTRAST_CHOICES.find((choice) => choice === entry?.value) ?? 'standard';
}

async function writeContrast(choice: Contrast): Promise<void> {
  await putMeta({ key: KEY, value: choice });
}

export { CONTRAST_CHOICES, readContrast, writeContrast };
export type { Contrast };
