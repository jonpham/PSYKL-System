import { describe, expect, it } from 'vitest';

import { createListRemote, deleteListRemote, listListsRemote, patchListRemote } from '../lists.api-client';

const listId = '0196f0a4-8b5a-7000-8000-000000000010';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000011';
const nowIso = '2026-06-12T16:00:00.000Z';

describe('lists.api-client', () => {
  it('creates a list and normalizes the response into {data, error, status}', async () => {
    // When
    const result = await createListRemote(
      { id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso },
      idempotencyKey,
    );

    // Then
    expect(result.status).toBe(201);
    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({ id: listId, title: 'Groceries' });
  });

  it('lists lists, including ones just created — the hydration path that never existed before', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await listListsRemote();

    // Then
    expect(result.status).toBe(200);
    expect(result.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId })]));
  });

  it('patches a list', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);
    const laterIso = '2026-06-12T16:01:00.000Z';

    // When
    const result = await patchListRemote(listId, { title: 'Weekly Groceries', updated_at: laterIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({ title: 'Weekly Groceries' });
  });

  it('deletes a list', async () => {
    // Given
    await createListRemote({ id: listId, title: 'Groceries', position: 'a0', updated_at: nowIso }, idempotencyKey);
    const laterIso = '2026-06-12T16:01:00.000Z';

    // When
    const result = await deleteListRemote(listId, { deleted_at: laterIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(200);
    expect(result.data?.deleted_at).toBe(laterIso);
  });

  it('surfaces a non-2xx status as {status, error} instead of throwing', async () => {
    // When
    const result = await createListRemote({ id: listId, title: '', position: '', updated_at: nowIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(400);
    expect(result.data).toBeUndefined();
  });
});
