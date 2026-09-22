import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../db/idb';
import { readCompletedVisibility, writeCompletedVisibility } from '../completedVisibility';

afterEach(async () => {
  await deleteDB('psykl');
});

describe('completed visibility preference', () => {
  it('shows completed tasks until the user says otherwise', async () => {
    // Given a list nobody has expressed a preference about
    // When / Then
    await expect(readCompletedVisibility('list-1')).resolves.toBe(true);
  });

  it('round-trips through sync_meta', async () => {
    // Given
    await writeCompletedVisibility('list-1', false);

    // When
    const visible = await readCompletedVisibility('list-1');

    // Then
    expect(visible).toBe(false);
  });

  it('keeps the preference to the list it was set on', async () => {
    // Given
    await writeCompletedVisibility('list-1', false);

    // When
    const other = await readCompletedVisibility('list-2');

    // Then
    expect(other).toBe(true);
  });

  it('never enqueues the preference for sync', async () => {
    // Given — how you like to look at a list is a property of this device
    await writeCompletedVisibility('list-1', false);

    // When
    const queue = await listSyncQueue();

    // Then
    expect(queue).toHaveLength(0);
  });

  it('has no preference to read or write without a list', async () => {
    // Given no active list
    await writeCompletedVisibility(null, false);

    // When / Then
    await expect(readCompletedVisibility(null)).resolves.toBe(true);
  });
});
