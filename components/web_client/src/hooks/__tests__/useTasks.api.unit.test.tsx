import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { resetActiveListForTest, setActiveListId } from '../useActiveList';
import { useTasksApiClient } from '../useTasks.api';

const groceriesId = '0199cccc-0000-7000-8000-000000000001';

function task(id: string, title: string, listId: string | null, createdAt: string, extra: Partial<Task> = {}): Task {
  return {
    completed_at: null,
    created_at: createdAt,
    deleted_at: null,
    id,
    list_id: listId,
    server_updated_at: createdAt,
    title,
    updated_at: createdAt,
    user_id: 'local',
    ...extra,
  };
}

const stamps = task('0199dddd-0000-7000-8000-000000000001', 'buy stamps', DEFAULT_LIST_ID, '2026-11-14T10:00:00.000Z');
const legacy = task('0199dddd-0000-7000-8000-000000000002', 'old task', null, '2026-11-14T09:00:00.000Z');
const milk = task('0199dddd-0000-7000-8000-000000000003', 'oat milk', groceriesId, '2026-11-14T11:00:00.000Z');
const gone = task('0199dddd-0000-7000-8000-000000000004', 'gone', DEFAULT_LIST_ID, '2026-11-14T12:00:00.000Z', {
  deleted_at: '2026-11-14T12:30:00.000Z',
});

function serverHolds(tasks: Task[]) {
  server.use(http.get('*/tasks', () => HttpResponse.json(tasks)));
}

function echoCreate(sent: { body?: Record<string, unknown> }) {
  server.use(
    http.post('*/tasks', async ({ request }) => {
      const body = (await request.json()) as { id: string; list_id: string | null; title: string; updated_at: string };
      sent.body = body;
      return HttpResponse.json(task(body.id, body.title, body.list_id, body.updated_at), { status: 201 });
    }),
  );
}

async function renderTasks() {
  const { result } = renderHook(() => useTasksApiClient(), { wrapper: createApiPathWrapper() });
  await waitFor(() => expect(result.current.loading).toBe(false));
  return result;
}

afterEach(async () => {
  resetActiveListForTest();
  await deleteDB('psykl');
});

describe('useTasksApiClient', () => {
  it('shows only the open tasks of the active list, newest first, with list-less tasks under Tasks', async () => {
    // Arrange
    serverHolds([legacy, stamps, milk, gone]);
    await setActiveListId(DEFAULT_LIST_ID);

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.tasks.map((item) => item.title)).toEqual(['buy stamps', 'old task']);
    expect(result.current.error).toBeNull();
  });

  it('shows another list’s tasks when that list is active', async () => {
    // Arrange
    serverHolds([stamps, milk]);
    await setActiveListId(groceriesId);

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.tasks.map((item) => item.title)).toEqual(['oat milk']);
  });

  it('captures a task into the list that was active when it was typed', async () => {
    // Arrange
    serverHolds([]);
    await setActiveListId(groceriesId);
    const sent: { body?: Record<string, unknown> } = {};
    echoCreate(sent);
    const result = await renderTasks();

    // Act
    const capture = result.current.createTask('pasta');
    await setActiveListId(DEFAULT_LIST_ID);
    await act(() => capture);

    // Assert
    expect(sent.body?.['list_id']).toBe(groceriesId);
  });

  it('captures into Tasks when no list has been chosen on this device', async () => {
    // Arrange
    serverHolds([]);
    const sent: { body?: Record<string, unknown> } = {};
    echoCreate(sent);
    const result = await renderTasks();

    // Act
    await act(() => result.current.createTask('pasta'));

    // Assert
    expect(sent.body?.['list_id']).toBe(DEFAULT_LIST_ID);
    await waitFor(() => expect(result.current.tasks.map((item) => item.title)).toEqual(['pasta']));
  });

  it('completes a task once the server has it', async () => {
    // Arrange
    serverHolds([stamps]);
    await setActiveListId(DEFAULT_LIST_ID);
    server.use(
      http.patch('*/tasks/:id', async ({ request }) => {
        const body = (await request.json()) as { completed_at: string; updated_at: string };
        return HttpResponse.json({ ...stamps, completed_at: body.completed_at, updated_at: body.updated_at });
      }),
    );
    const result = await renderTasks();
    const at = '2026-11-14T13:00:00.000Z';

    // Act
    await act(() => result.current.patchTask(stamps.id, { completed_at: at, updated_at: at }, stamps));

    // Assert
    await waitFor(() => expect(result.current.tasks[0]?.completed_at).toBe(at));
  });

  it('stops showing a deleted task', async () => {
    // Arrange
    serverHolds([stamps]);
    await setActiveListId(DEFAULT_LIST_ID);
    server.use(
      http.delete('*/tasks/:id', () => HttpResponse.json({ ...stamps, deleted_at: '2026-11-14T13:00:00.000Z' })),
    );
    const result = await renderTasks();
    const at = '2026-11-14T13:00:00.000Z';

    // Act
    await act(() =>
      result.current.deleteTask(stamps.id, { deleted_at: at, updated_at: at }, { ...stamps, deleted_at: at }),
    );

    // Assert
    await waitFor(() => expect(result.current.tasks).toEqual([]));
  });

  it('says the tasks could not be loaded when the server is unreachable', async () => {
    // Arrange
    server.use(http.get('*/tasks', () => HttpResponse.error()));

    // Act
    const result = await renderTasks();

    // Assert
    expect(result.current.error).toBe('Failed to load tasks');
    expect(result.current.tasks).toEqual([]);
  });

  it('shows nothing new when the server refuses a capture', async () => {
    // Arrange
    serverHolds([]);
    server.use(http.post('*/tasks', () => new HttpResponse(null, { status: 503 })));
    const result = await renderTasks();

    // Act / Assert
    await expect(result.current.createTask('pasta')).rejects.toThrow('create failed');
    expect(result.current.tasks).toEqual([]);
  });
});
