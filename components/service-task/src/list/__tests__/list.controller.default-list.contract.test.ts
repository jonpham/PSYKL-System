import { DEFAULT_LIST_ID } from '@psykl/shared-types';
import { describe, expect, it } from 'vitest';

import {
  listControllerHarness,
  listCreateBody,
  listDeleteBody,
  validListId,
} from './list.controller.contract-support.js';

/**
 * Behavior enforced by:
 * components/service-task/src/list/list.service.ts (deleteList, appendPosition)
 */
describe('DELETE /lists/{id}', () => {
  const harness = listControllerHarness();

  it('refuses to delete the default list', async () => {
    // Given
    await harness.createList({ body: listCreateBody({ id: DEFAULT_LIST_ID, title: 'Tasks' }) }).expect(201);

    // When
    const response = await harness.deleteList({ id: DEFAULT_LIST_ID, body: listDeleteBody() }).expect(409);

    // Then
    expect(response.body.message).toBe('The default list cannot be deleted');
    const lists = await harness.getLists().expect(200);
    expect(
      (lists.body as Array<{ id: string; deleted_at: string | null }>).find((l) => l.id === DEFAULT_LIST_ID)
        ?.deleted_at,
    ).toBeNull();
  });

  it('still deletes any other list', async () => {
    // Given
    await harness.createList({ body: listCreateBody({ id: validListId('301') }) }).expect(201);

    // When / Then
    await harness.deleteList({ id: validListId('301'), body: listDeleteBody() }).expect(200);
  });

  it('answers 404, not 409, to a caller who does not own the default list', async () => {
    // When / Then
    await harness.deleteList({ id: DEFAULT_LIST_ID, userId: 'someone-else', body: listDeleteBody() }).expect(404);
  });
});

describe('POST /lists', () => {
  const harness = listControllerHarness();

  it('creates a list without a position and returns the one the server chose', async () => {
    // Given
    const body = { id: validListId('401'), title: 'no position', updated_at: '2026-05-20T12:00:00.000Z' };

    // When
    const response = await harness.createList({ userId: 'position-contract-user', body }).expect(201);

    // Then
    expect(response.body).toMatchObject({ id: validListId('401'), title: 'no position', position: 'a0' });
  });

  it('still rejects an empty position', async () => {
    // When / Then
    await harness
      .createList({ userId: 'position-contract-user', body: listCreateBody({ id: validListId('402'), position: '' }) })
      .expect(400);
  });
});
