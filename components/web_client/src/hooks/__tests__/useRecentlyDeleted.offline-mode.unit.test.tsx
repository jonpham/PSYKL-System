import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { listSyncQueue } from '../../db/idb';
import { writeOfflineMode } from '../../preferences/offlineMode';
import { server } from '../../test/setup';
import { useRecentlyDeleted } from '../useRecentlyDeleted';
import { resetUseTasksForTest } from '../useTasks';

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

afterEach(async () => {
  localStorage.clear();
  resetUseTasksForTest();
  await deleteDB('psykl');
});

describe('useRecentlyDeleted with Offline Mode off', () => {
  it('restores through the server, not the sync queue', async () => {
    // Arrange
    writeOfflineMode(false);
    const id = '0196f0a4-8b5a-7000-8000-000000000099';
    const milk = {
      completed_at: null,
      created_at: '2026-11-17T10:00:00.000Z',
      deleted_at: new Date().toISOString(),
      id,
      list_id: null,
      server_updated_at: '2026-11-17T10:00:00.000Z',
      title: 'Milk',
      updated_at: '2026-11-17T10:00:00.000Z',
      user_id: 'local',
    };
    const restored: string[] = [];
    server.use(
      http.get('*/deleted', () => HttpResponse.json({ lists: [], tasks: restored.length ? [] : [milk] })),
      http.post('*/tasks/:id/restore', ({ params }) => {
        restored.push(String(params['id']));
        return HttpResponse.json({ ...milk, deleted_at: null });
      }),
    );
    const { result } = renderHook(() => useRecentlyDeleted(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Act
    await act(() => result.current.restore(result.current.items[0]!));

    // Assert
    expect(restored).toEqual([id]);
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
