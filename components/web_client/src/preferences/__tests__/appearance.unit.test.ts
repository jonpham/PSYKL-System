import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../db/idb';
import { readAppearance, writeAppearance } from '../appearance';
import { readContrast, writeContrast } from '../contrast';

afterEach(async () => {
  await deleteDB('psykl');
});

describe('appearance preference', () => {
  it('defers to the device until the user chooses otherwise', async () => {
    // When / Then
    await expect(readAppearance()).resolves.toBe('system');
  });

  it('round-trips a choice through sync_meta', async () => {
    // Given
    await writeAppearance('dark');

    // When / Then
    await expect(readAppearance()).resolves.toBe('dark');
  });

  it('never enqueues the choice for sync', async () => {
    // Given — appearance is a property of this device, not of the account
    await writeAppearance('light');

    // When / Then
    await expect(listSyncQueue()).resolves.toHaveLength(0);
  });

  it('falls back to the device default when the stored value is not a choice', async () => {
    // Given a value written by some older or broken build
    await writeAppearance('dark');
    await writeAppearance('sepia' as never);

    // When / Then
    await expect(readAppearance()).resolves.toBe('system');
  });
});

describe('contrast preference', () => {
  it('is standard until the user asks for more', async () => {
    // When / Then
    await expect(readContrast()).resolves.toBe('standard');
  });

  it('round-trips increased contrast through sync_meta', async () => {
    // Given
    await writeContrast('increased');

    // When / Then
    await expect(readContrast()).resolves.toBe('increased');
  });

  it('never enqueues the choice for sync', async () => {
    // Given
    await writeContrast('increased');

    // When / Then
    await expect(listSyncQueue()).resolves.toHaveLength(0);
  });

  it('composes with an appearance rather than replacing it', async () => {
    // Given both are set
    await writeAppearance('dark');
    await writeContrast('increased');

    // When
    const [appearance, contrast] = await Promise.all([readAppearance(), readContrast()]);

    // Then — four combinations exist, and neither preference erases the other
    expect({ appearance, contrast }).toEqual({ appearance: 'dark', contrast: 'increased' });
  });
});
