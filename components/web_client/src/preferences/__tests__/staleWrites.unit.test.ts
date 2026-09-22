import 'fake-indexeddb/auto';

import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { listSyncQueue } from '../../db/idb';
import { dismissStaleWrite, listStaleWrites, recordStaleWrite } from '../staleWrites';

const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
const anHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const aMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

function conflict(overrides: Partial<Parameters<typeof recordStaleWrite>[0]> = {}) {
  return {
    entityId: 'task-1',
    recordedAt: new Date().toISOString(),
    won: { title: 'Call the dentist back', updated_at: '2026-06-01T10:00:00.000Z' },
    wrote: { title: 'Dentist: reschedule', updated_at: '2026-06-01T09:00:00.000Z' },
    ...overrides,
  };
}

afterEach(async () => {
  await deleteDB('psykl');
});

describe('stale write records', () => {
  it('has nothing to show until a change is superseded', async () => {
    // When / Then
    await expect(listStaleWrites()).resolves.toEqual([]);
  });

  it('keeps both the change that was rejected and the one that replaced it', async () => {
    // Given a local edit lost a last-write-wins race
    await recordStaleWrite(conflict());

    // When
    const [record] = await listStaleWrites();

    // Then — the user can read their own words back, not just be told they lost
    expect(record?.wrote.title).toBe('Dentist: reschedule');
    expect(record?.won.title).toBe('Call the dentist back');
  });

  it('is never enqueued for sync', async () => {
    // Given — a conflict is a fact about this device's history
    await recordStaleWrite(conflict());

    // When / Then
    await expect(listSyncQueue()).resolves.toHaveLength(0);
  });

  it('keeps a record the user has not dismissed', async () => {
    // Given
    await recordStaleWrite(conflict());
    const [record] = await listStaleWrites();

    // When
    await dismissStaleWrite(`${record?.id}-not-this-one`);

    // Then
    await expect(listStaleWrites()).resolves.toHaveLength(1);
  });

  it('drops a record the user dismisses', async () => {
    // Given
    await recordStaleWrite(conflict());
    const [record] = await listStaleWrites();

    // When
    await dismissStaleWrite(record?.id ?? '');

    // Then
    await expect(listStaleWrites()).resolves.toEqual([]);
  });

  it('lets a record go after 30 days', async () => {
    // Given a conflict from last month the user never dismissed
    await recordStaleWrite(conflict({ recordedAt: thirtyOneDaysAgo }));

    // When / Then
    await expect(listStaleWrites()).resolves.toEqual([]);
  });

  it('shows the most recent conflict first', async () => {
    // Given
    await recordStaleWrite(conflict({ entityId: 'older', recordedAt: anHourAgo }));
    await recordStaleWrite(conflict({ entityId: 'newer', recordedAt: aMinuteAgo }));

    // When
    const records = await listStaleWrites();

    // Then
    expect(records.map((record) => record.entityId)).toEqual(['newer', 'older']);
  });
});
