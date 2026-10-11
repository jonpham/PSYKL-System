import { act, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserSettings } from '../../../hooks/useUserSettings';
import { readOfflineMode, writeOfflineMode } from '../../../preferences/offlineMode';
import { SettingsProvider } from '../SettingsProvider';

const onMount = vi.fn();
let setOfflineMode: (offlineMode: boolean) => void = () => {};

function Probe() {
  const settings = useUserSettings();
  setOfflineMode = settings.setOfflineMode;
  useEffect(() => {
    onMount();
  }, []);
  return <p>{settings.offlineMode ? 'offline-mode-on' : 'offline-mode-off'}</p>;
}

afterEach(() => {
  localStorage.clear();
  onMount.mockClear();
});

describe('SettingsProvider', () => {
  it('defaults Offline Mode on when nothing is stored', () => {
    // Act
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByText('offline-mode-on')).toBeInTheDocument();
  });

  it('reads a stored Offline Mode', () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByText('offline-mode-off')).toBeInTheDocument();
  });

  it('persists a change and remounts its children so every hook picks the new path', () => {
    // Arrange
    render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    expect(onMount).toHaveBeenCalledTimes(1);

    // Act
    act(() => setOfflineMode(false));

    // Assert
    expect(screen.getByText('offline-mode-off')).toBeInTheDocument();
    expect(readOfflineMode()).toBe(false);
    expect(onMount).toHaveBeenCalledTimes(2);
  });
});
