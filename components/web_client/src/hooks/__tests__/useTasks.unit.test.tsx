import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../api/client';
import { putTask } from '../../db/idb';
import { server } from '../../test/setup';
import { notifyTasksChanged, resetUseTasksForTest, useTasks } from '../useTasks';

const databaseName = 'psykl';

const visibleTask = taskFactory({
  id: '0196f0a4-8b5a-7000-8000-000000000101',
  title: 'visible task',
});

const tombstonedTask = taskFactory({
  deleted_at: '2026-06-12T17:00:00.000Z',
  id: '0196f0a4-8b5a-7000-8000-000000000102',
  title: 'deleted task',
});

afterEach(async () => {
  resetUseTasksForTest();
  vi.unstubAllGlobals();
  await deleteDB(databaseName);
});

describe('useTasks', () => {
  it('renders the visible IndexedDB snapshot', async () => {
    // Arrange
    await putTask(visibleTask);
    await putTask(tombstonedTask);

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([visibleTask]);
  });

  it('rerenders subscribers after same-tab task notifications', async () => {
    // Arrange
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    await putTask(visibleTask);
    await act(async () => {
      await notifyTasksChanged();
    });

    // Assert
    expect(result.current.tasks).toEqual([visibleTask]);
  });

  it('reloads the snapshot after BroadcastChannel task notifications', async () => {
    // Arrange
    const broadcast = installBroadcastChannelMock();
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    await putTask(visibleTask);
    await act(async () => {
      broadcast.dispatch({ type: 'tasks-changed' });
    });

    // Assert
    await waitFor(() => expect(result.current.tasks).toEqual([visibleTask]));
  });

  it('keeps rendering the IndexedDB snapshot when hydration fails', async () => {
    // Arrange
    server.use(http.get('*/tasks', () => HttpResponse.error()));
    await putTask(visibleTask);

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.tasks).toEqual([visibleTask]);
  });

  it('reports a hydration error on non-OK status when no IndexedDB snapshot exists', async () => {
    // Arrange
    let includeDeleted: string | null = null;
    server.use(
      http.get('*/tasks', ({ request }) => {
        includeDeleted = new URL(request.url).searchParams.get('include_deleted');

        return new HttpResponse(null, { status: 500 });
      }),
    );

    // Act
    const { result } = renderHook(() => useTasks());

    // Assert
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(includeDeleted).toBe('1');
    expect(result.current.error).toBe('Failed to load tasks');
    expect(result.current.tasks).toEqual([]);
  });
});

function taskFactory(overrides: Partial<Task>): Task {
  return {
    id: '0196f0a4-8b5a-7000-8000-000000000100',
    user_id: 'local',
    title: 'task',
    created_at: '2026-06-12T16:00:00.000Z',
    completed_at: null,
    updated_at: '2026-06-12T16:00:00.000Z',
    server_updated_at: '2026-06-12T16:00:01.000Z',
    deleted_at: null,
    ...overrides,
  };
}

function installBroadcastChannelMock() {
  let listener: ((event: MessageEvent) => void) | undefined;
  const channel = {
    close: vi.fn(),
    dispatch(data: unknown) {
      listener?.({ data } as MessageEvent);
    },
    postMessage: vi.fn(),
  };

  vi.stubGlobal(
    'BroadcastChannel',
    vi.fn(() => ({
      addEventListener: (_event: 'message', callback: (event: MessageEvent) => void) => {
        listener = callback;
      },
      close: channel.close,
      postMessage: channel.postMessage,
      removeEventListener: vi.fn(),
    })),
  );

  return channel;
}
