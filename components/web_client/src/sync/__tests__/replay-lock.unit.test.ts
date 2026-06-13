import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { getMeta } from '../../db/idb';
import { acquireReplayLock, releaseReplayLock } from '../replay';

const databaseName = 'psykl';
const nowIso = '2026-06-12T16:00:00.000Z';

afterEach(async () => {
  await deleteDB(databaseName);
});

describe('replay lock', () => {
  it('lets the first caller acquire the lock', async () => {
    // When
    const acquired = await acquireReplayLock({
      now: () => new Date(nowIso),
      owner: 'page',
    });

    // Then
    expect(acquired).toBe(true);
    await expect(getMeta('replay_lock')).resolves.toEqual({
      key: 'replay_lock',
      value: {
        owner: 'page',
        heartbeat_at: nowIso,
      },
    });
  });

  it('makes a second caller yield while the lock is fresh', async () => {
    // Given
    await acquireReplayLock({ now: () => new Date(nowIso), owner: 'page' });

    // When
    const acquired = await acquireReplayLock({
      now: () => new Date('2026-06-12T16:00:10.000Z'),
      owner: 'service-worker',
    });

    // Then
    expect(acquired).toBe(false);
    await expect(getMeta('replay_lock')).resolves.toMatchObject({
      value: { owner: 'page' },
    });
  });

  it('lets a second caller steal a stale lock after 30 seconds', async () => {
    // Given
    await acquireReplayLock({ now: () => new Date(nowIso), owner: 'page' });

    // When
    const acquired = await acquireReplayLock({
      now: () => new Date('2026-06-12T16:00:31.000Z'),
      owner: 'service-worker',
    });

    // Then
    expect(acquired).toBe(true);
    await expect(getMeta('replay_lock')).resolves.toMatchObject({
      value: {
        owner: 'service-worker',
        heartbeat_at: '2026-06-12T16:00:31.000Z',
      },
    });
  });

  it('only releases the lock for the owning caller', async () => {
    // Given
    await acquireReplayLock({ now: () => new Date(nowIso), owner: 'page' });

    // When
    await releaseReplayLock({ owner: 'service-worker' });

    // Then
    await expect(getMeta('replay_lock')).resolves.toMatchObject({
      value: { owner: 'page' },
    });
  });
});
