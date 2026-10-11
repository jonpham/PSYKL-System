import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { writeOfflineMode } from '../../preferences/offlineMode';
import { useLists } from '../useLists';

const { mockUseListsApiClient, mockUseListsSyncClient } = vi.hoisted(() => ({
  mockUseListsApiClient: vi.fn(() => ({ source: 'api' })),
  mockUseListsSyncClient: vi.fn(() => ({ source: 'sync' })),
}));

vi.mock('../useLists.api', () => ({ useListsApiClient: mockUseListsApiClient }));
vi.mock('../useLists.sync', () => ({ useListsSyncClient: mockUseListsSyncClient }));

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useLists data-mode seam', () => {
  it('uses the sync client when no provider is mounted', () => {
    // Act
    const { result } = renderHook(() => useLists());

    // Assert
    expect(result.current).toEqual({ source: 'sync' });
    expect(mockUseListsApiClient).not.toHaveBeenCalled();
  });

  it('uses the sync client when Offline Mode is on', () => {
    // Arrange
    writeOfflineMode(true);

    // Act
    const { result } = renderHook(() => useLists(), { wrapper });

    // Assert
    expect(result.current).toEqual({ source: 'sync' });
  });

  it('uses the api client when Offline Mode is off', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    const { result } = renderHook(() => useLists(), { wrapper });

    // Assert
    expect(result.current).toEqual({ source: 'api' });
    expect(mockUseListsSyncClient).not.toHaveBeenCalled();
  });
});
