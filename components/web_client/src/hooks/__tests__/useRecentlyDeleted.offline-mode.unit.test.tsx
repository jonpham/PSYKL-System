import 'fake-indexeddb/auto';

import { renderHook } from '@testing-library/react';
import { deleteDB } from 'idb';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { listSyncQueue } from '../../db/idb';
import { writeOfflineMode } from '../../preferences/offlineMode';
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
  it('refuses a restore with the named error instead of writing to the server', async () => {
    // Arrange
    writeOfflineMode(false);
    const { result } = renderHook(() => useRecentlyDeleted(), { wrapper });
    const item = {
      daysRemaining: 28,
      deletedAt: new Date().toISOString(),
      id: '0196f0a4-8b5a-7000-8000-000000000099',
      title: 'Milk',
      type: 'task' as const,
    };

    // Act / Assert
    await expect(result.current.restore(item)).rejects.toMatchObject({
      message: 'restore is not available with Offline Mode off yet',
    });
    await expect(listSyncQueue()).resolves.toEqual([]);
  });
});
