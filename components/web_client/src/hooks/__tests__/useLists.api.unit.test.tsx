import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import type { ListRecord } from '../../db/idb.types';
import { DEFAULT_LIST_ID } from '../../services/default-list';
import { createApiPathWrapper } from '../../test/api-path-wrapper';
import { server } from '../../test/setup';
import { useListsApiClient } from '../useLists.api';

function list(id: string, title: string, position: string): ListRecord {
  const at = '2026-11-14T10:00:00.000Z';
  return {
    created_at: at,
    deleted_at: null,
    id,
    position,
    server_updated_at: at,
    title,
    updated_at: at,
    user_id: 'local',
  };
}

const tasksList = list(DEFAULT_LIST_ID, 'Tasks', 'a0');
const groceries = list('0199cccc-0000-7000-8000-000000000001', 'Groceries', 'a2');

function serverHolds(lists: ListRecord[]) {
  server.use(http.get('*/lists', () => HttpResponse.json(lists)));
}

async function renderLists() {
  const { result } = renderHook(() => useListsApiClient(), { wrapper: createApiPathWrapper() });
  await waitFor(() => expect(result.current.lists.length).toBeGreaterThan(0));
  return result;
}

describe('useListsApiClient', () => {
  it('shows the lists the server holds, in position order', async () => {
    // Arrange
    serverHolds([groceries, tasksList]);

    // Act
    const result = await renderLists();

    // Assert
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Groceries']);
  });

  it('adds a list without picking its position and shows the one the server gave it', async () => {
    // Arrange
    serverHolds([tasksList]);
    let sent: Record<string, unknown> = {};
    server.use(
      http.post('*/lists', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(list(String(sent['id']), String(sent['title']), 'a1'), { status: 201 });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.createList('Reading'));

    // Assert
    expect(sent).not.toHaveProperty('position');
    await waitFor(() =>
      expect(result.current.lists.map((item) => [item.title, item.position])).toEqual([
        ['Tasks', 'a0'],
        ['Reading', 'a1'],
      ]),
    );
  });

  it('renames a list once the server has it', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    server.use(
      http.patch('*/lists/:id', async ({ request }) => {
        const body = (await request.json()) as { title: string; updated_at: string };
        return HttpResponse.json({ ...groceries, title: body.title, updated_at: body.updated_at });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.renameList(groceries.id, 'Food'));

    // Assert
    await waitFor(() => expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Food']));
  });

  it('moves a list between its neighbours', async () => {
    // Arrange
    const reading = list('0199cccc-0000-7000-8000-000000000002', 'Reading', 'a4');
    serverHolds([tasksList, groceries, reading]);
    let sentPosition = '';
    server.use(
      http.patch('*/lists/:id', async ({ request }) => {
        const body = (await request.json()) as { position: string; updated_at: string };
        sentPosition = body.position;
        return HttpResponse.json({ ...reading, position: body.position });
      }),
    );
    const result = await renderLists();

    // Act — Reading goes between Tasks (a0) and Groceries (a2)
    await act(() => result.current.moveList(reading.id, tasksList, groceries));

    // Assert
    expect(sentPosition > 'a0' && sentPosition < 'a2').toBe(true);
    await waitFor(() =>
      expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Reading', 'Groceries']),
    );
  });

  it('refuses a move between neighbours out of order and keeps the lists as they were', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    const result = await renderLists();

    // Act / Assert
    await expect(result.current.moveList(tasksList.id, groceries, groceries)).rejects.toThrow();
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks', 'Groceries']);
  });

  it('never offers to delete Tasks or the last list, and offers any other', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    const result = await renderLists();

    // Assert
    expect(result.current.canDeleteList(DEFAULT_LIST_ID)).toBe(false);
    expect(result.current.canDeleteList(groceries.id)).toBe(true);
  });

  it('deletes another list and stops showing it', async () => {
    // Arrange
    serverHolds([tasksList, groceries]);
    let deleted = '';
    server.use(
      http.delete('*/lists/:id', ({ params }) => {
        deleted = String(params['id']);
        return HttpResponse.json({ ...groceries, deleted_at: '2026-11-14T11:00:00.000Z' });
      }),
    );
    const result = await renderLists();

    // Act
    await act(() => result.current.deleteList(groceries.id));

    // Assert
    expect(deleted).toBe(groceries.id);
    await waitFor(() => expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks']));
  });

  it('keeps the lists as they were when the server refuses a write', async () => {
    // Arrange
    serverHolds([tasksList]);
    server.use(http.post('*/lists', () => new HttpResponse(null, { status: 503 })));
    const result = await renderLists();

    // Act / Assert
    await expect(result.current.createList('Reading')).rejects.toThrow('create failed');
    expect(result.current.lists.map((item) => item.title)).toEqual(['Tasks']);
  });
});
