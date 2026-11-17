import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { Task } from '../../api/client';
import type { ListRecord } from '../../db/idb.types';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { useRecentlyDeletedApiClient } from '../useRecentlyDeleted.api';
import { useTasksApiClient } from '../useTasks.api';

const now = new Date().toISOString();
const groceriesId = '0199eeee-0000-7000-8000-0000000000a1';

function task(id: string, title: string, extra: Partial<Task> = {}): Task {
  return {
    completed_at: null,
    created_at: now,
    deleted_at: now,
    id,
    list_id: DEFAULT_LIST_ID,
    server_updated_at: now,
    title,
    updated_at: now,
    user_id: 'local',
    ...extra,
  };
}

const groceries: ListRecord = {
  created_at: now,
  deleted_at: now,
  id: groceriesId,
  position: 'a1',
  server_updated_at: now,
  title: 'Groceries',
  updated_at: now,
  user_id: 'local',
};

/** A server whose Recently Deleted shrinks as rows are restored. */
function serverDeleted(initial: { lists?: ListRecord[]; tasks?: Task[] }) {
  const rows = { lists: [...(initial.lists ?? [])], tasks: [...(initial.tasks ?? [])] };
  const restored: string[] = [];
  server.use(
    http.get('*/deleted', () => HttpResponse.json(rows)),
    http.get('*/tasks', () => HttpResponse.json([])),
    http.post('*/tasks/:id/restore', ({ params }) => {
      const found = rows.tasks.find((row) => row.id === params['id']);
      rows.tasks = rows.tasks.filter((row) => row.id !== params['id']);
      restored.push(String(params['id']));
      return HttpResponse.json({ ...found, deleted_at: null });
    }),
    http.post('*/lists/:id/restore', ({ params }) => {
      const found = rows.lists.find((row) => row.id === params['id']);
      rows.lists = rows.lists.filter((row) => row.id !== params['id']);
      restored.push(String(params['id']));
      return HttpResponse.json({ ...found, deleted_at: null });
    }),
  );
  return { restored, rows };
}

async function renderDeleted() {
  const { result } = renderHook(() => useRecentlyDeletedApiClient(), { wrapper: createApiPathWrapper() });
  return result;
}

describe('useRecentlyDeletedApiClient', () => {
  it('shows what the server holds as recently deleted', async () => {
    // Arrange
    serverDeleted({ tasks: [task('0199eeee-0000-7000-8000-000000000001', 'Milk')] });

    // Act
    const result = await renderDeleted();

    // Assert
    await waitFor(() => expect(result.current.items.map((item) => item.title)).toEqual(['Milk']));
    expect(result.current.items[0]?.daysRemaining).toBe(30);
  });

  it('restores a task on the server, then no longer lists it', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000001', 'Milk');
    const { restored } = serverDeleted({ tasks: [milk] });
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act
    await act(() => result.current.restore(result.current.items[0]!));

    // Assert
    expect(restored).toEqual([milk.id]);
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it('restores a list together with the tasks deleted with it, and no others', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000002', 'Milk', { list_id: groceriesId });
    // Deleted on its own a day earlier, so not part of the list's delete.
    const eggs = task('0199eeee-0000-7000-8000-000000000003', 'Eggs', {
      deleted_at: new Date(Date.now() - 86_400_000).toISOString(),
      list_id: groceriesId,
    });
    const { restored } = serverDeleted({ lists: [groceries], tasks: [milk, eggs] });
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(3));

    // Act
    const list = result.current.items.find((item) => item.type === 'list')!;
    await act(() => result.current.restore(list));

    // Assert
    expect(restored).toEqual([groceriesId, milk.id]);
    await waitFor(() => expect(result.current.items.map((item) => item.title)).toEqual(['Eggs']));
  });

  it('refreshes Recently Deleted even when the server refuses a restore', async () => {
    // Arrange
    const milk = task('0199eeee-0000-7000-8000-000000000001', 'Milk');
    let reads = 0;
    server.use(
      http.get('*/deleted', () => {
        reads += 1;
        return HttpResponse.json({ lists: [], tasks: [milk] });
      }),
      http.post('*/tasks/:id/restore', () => new HttpResponse(null, { status: 503 })),
    );
    const result = await renderDeleted();
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act / Assert
    await expect(act(() => result.current.restore(result.current.items[0]!))).rejects.toMatchObject({
      message: expect.stringContaining('restore failed'),
    });
    await waitFor(() => expect(reads).toBe(2));
    expect(result.current.items.map((item) => item.title)).toEqual(['Milk']);
  });

  it('shows a task deleted on this path without a reload', async () => {
    // Arrange
    const stamps = task('0199eeee-0000-7000-8000-000000000004', 'buy stamps', { deleted_at: null });
    const deletedTasks: Task[] = [];
    server.use(
      http.get('*/tasks', () => HttpResponse.json([stamps])),
      http.get('*/deleted', () => HttpResponse.json({ lists: [], tasks: deletedTasks })),
      http.delete('*/tasks/:id', async ({ request }) => {
        const body = (await request.json()) as { deleted_at: string; updated_at: string };
        const deleted = { ...stamps, ...body };
        deletedTasks.push(deleted);
        return HttpResponse.json(deleted);
      }),
    );
    const { result } = renderHook(() => ({ deleted: useRecentlyDeletedApiClient(), tasks: useTasksApiClient() }), {
      wrapper: createApiPathWrapper(),
    });
    await waitFor(() => expect(result.current.tasks.tasks).toHaveLength(1));

    // Act
    await act(() => result.current.tasks.deleteTask(stamps.id, { deleted_at: now, updated_at: now }, stamps));

    // Assert
    await waitFor(() => expect(result.current.deleted.items.map((item) => item.title)).toEqual(['buy stamps']));
  });
});
