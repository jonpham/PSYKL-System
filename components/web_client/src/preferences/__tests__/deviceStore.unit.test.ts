import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readAppearance, writeAppearance } from '../appearance';
import { readDeviceValue, writeDeviceValue } from '../deviceStore';

afterEach(async () => {
  vi.unstubAllGlobals();
  localStorage.clear();
  await deleteDB('psykl');
});

describe('device store', () => {
  it('keeps a value in IndexedDB when it can be opened', async () => {
    await writeDeviceValue('pref:appearance', 'dark');

    expect(await readDeviceValue('pref:appearance')).toBe('dark');
    expect(localStorage.length).toBe(0);
  });

  it('falls back to localStorage when IndexedDB cannot be opened', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await writeDeviceValue('pref:show-completed:list-1', false);

    expect(await readDeviceValue('pref:show-completed:list-1')).toBe(false);
    expect(localStorage.getItem('psykl:pref:show-completed:list-1')).toBe('false');
  });

  it('reads nothing when neither store holds the value', async () => {
    vi.stubGlobal('indexedDB', undefined);

    expect(await readDeviceValue('pref:contrast')).toBeUndefined();
  });

  it('reads nothing from a fallback value that is not JSON', async () => {
    vi.stubGlobal('indexedDB', undefined);
    localStorage.setItem('psykl:pref:contrast', '{not json');

    expect(await readDeviceValue('pref:contrast')).toBeUndefined();
  });

  it('keeps an appearance across a reload without IndexedDB', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await writeAppearance('dark');

    expect(await readAppearance()).toBe('dark');
  });
});
