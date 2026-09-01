import { describe, expect, it } from 'vitest';

import { createTaskRemote, deleteTaskRemote, listTasksRemote, patchTaskRemote } from '../tasks.api-client';

const taskId = '0196f0a4-8b5a-7000-8000-000000000001';
const idempotencyKey = '0196f0a4-8b5a-7000-8000-000000000002';
const nowIso = '2026-06-12T16:00:00.000Z';

describe('tasks.api-client', () => {
  it('creates a task and normalizes the response into {data, error, status}', async () => {
    // When
    const result = await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(201);
    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({ id: taskId, title: 'wash the car' });
  });

  it('lists tasks, including ones just created', async () => {
    // Given
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);

    // When
    const result = await listTasksRemote();

    // Then
    expect(result.status).toBe(200);
    expect(result.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: taskId })]));
  });

  it('patches a task', async () => {
    // Given
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);
    const laterIso = '2026-06-12T16:01:00.000Z';

    // When
    const result = await patchTaskRemote(taskId, { title: 'wash the truck', updated_at: laterIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({ title: 'wash the truck' });
  });

  it('deletes a task', async () => {
    // Given
    await createTaskRemote({ id: taskId, title: 'wash the car', updated_at: nowIso }, idempotencyKey);
    const laterIso = '2026-06-12T16:01:00.000Z';

    // When
    const result = await deleteTaskRemote(taskId, { deleted_at: laterIso, updated_at: laterIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(200);
    expect(result.data?.deleted_at).toBe(laterIso);
  });

  it('surfaces a non-2xx status as {status, error} instead of throwing', async () => {
    // When
    const result = await createTaskRemote({ id: taskId, title: '', updated_at: nowIso }, idempotencyKey);

    // Then
    expect(result.status).toBe(400);
    expect(result.data).toBeUndefined();
  });
});
