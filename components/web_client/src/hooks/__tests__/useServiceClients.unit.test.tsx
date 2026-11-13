import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsProvider } from '../../components/SettingsProvider';
import { writeOfflineMode } from '../../preferences/offlineMode';
import { useServiceClients } from '../useServiceClients';
import { useUserSettings } from '../useUserSettings';

vi.mock('../../services/list-service-client', () => ({
  createListServiceClient: (offlineCapable: boolean) => ({ entity: 'list', offlineCapable }),
}));
vi.mock('../../services/task-service-client', () => ({
  createTaskServiceClient: (offlineCapable: boolean) => ({ entity: 'task', offlineCapable }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

afterEach(() => {
  localStorage.clear();
});

describe('useServiceClients', () => {
  it('gives the sync-path shims when no provider is mounted', () => {
    // Act
    const { result } = renderHook(() => useServiceClients());

    // Assert
    expect(result.current.lists).toEqual({ entity: 'list', offlineCapable: true });
    expect(result.current.tasks).toEqual({ entity: 'task', offlineCapable: true });
  });

  it('gives api-path shims when Offline Mode is off', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    const { result } = renderHook(() => useServiceClients(), { wrapper });

    // Assert
    expect(result.current.lists).toEqual({ entity: 'list', offlineCapable: false });
    expect(result.current.tasks).toEqual({ entity: 'task', offlineCapable: false });
  });

  it('hands out shims for the new mode after a switch, never the old ones', () => {
    // Arrange
    const { result } = renderHook(() => ({ clients: useServiceClients(), settings: useUserSettings() }), { wrapper });
    const before = result.current.clients.lists;

    // Act
    act(() => result.current.settings.setOfflineMode(false));

    // Assert
    expect(result.current.clients.lists).not.toBe(before);
    expect(result.current.clients.lists).toEqual({ entity: 'list', offlineCapable: false });
  });
});
