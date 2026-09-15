import { v7 as uuidv7 } from 'uuid';
import { describe, expect, it } from 'vitest';

import { listDeletedRemote } from '../deleted.api-client';
import { createTaskRemote, deleteTaskRemote } from '../tasks.api-client';

describe('listDeletedRemote', () => {
  it('GETs /deleted and returns the tombstoned Tasks and Lists', async () => {
    // Given
    const taskId = uuidv7();
    const now = new Date().toISOString();
    await createTaskRemote({ id: taskId, title: 'Milk', updated_at: now }, uuidv7());
    await deleteTaskRemote(taskId, { deleted_at: now, updated_at: now }, uuidv7());

    // When
    const result = await listDeletedRemote();

    // Then
    expect(result.status).toBe(200);
    expect(result.data?.tasks).toEqual([expect.objectContaining({ id: taskId, deleted_at: now })]);
    expect(result.data?.lists).toEqual([]);
  });
});
