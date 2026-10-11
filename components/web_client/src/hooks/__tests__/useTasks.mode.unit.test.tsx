import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { writeOfflineMode } from '../../preferences/offlineMode';
import { useTasks } from '../useTasks';

const { mockUseTasksApiClient, mockUseTasksSyncClient } = vi.hoisted(() => ({
  mockUseTasksApiClient: vi.fn(() => ({ source: 'api' })),
  mockUseTasksSyncClient: vi.fn(() => ({ source: 'sync' })),
}));

vi.mock('../useTasks.api', () => ({ useTasksApiClient: mockUseTasksApiClient }));
vi.mock('../useTasks.sync', () => ({ useTasksSyncClient: mockUseTasksSyncClient }));

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useTasks data-mode seam', () => {
  it('uses the sync client by default', () => {
    // Act
    const { result } = renderHook(() => useTasks(), { wrapper });

    // Assert
    expect(result.current).toEqual({ source: 'sync' });
    expect(mockUseTasksApiClient).not.toHaveBeenCalled();
  });

  it('uses the api client when Offline Mode is off', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    const { result } = renderHook(() => useTasks(), { wrapper });

    // Assert
    expect(result.current).toEqual({ source: 'api' });
    expect(mockUseTasksSyncClient).not.toHaveBeenCalled();
  });
});
