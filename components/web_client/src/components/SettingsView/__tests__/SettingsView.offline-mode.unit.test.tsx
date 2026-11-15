import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readOfflineMode, writeOfflineMode } from '../../../preferences/offlineMode';
import { SettingsProvider } from '../../SettingsProvider';
import { SettingsView } from '../SettingsView';

const { mockFlushSyncQueue } = vi.hoisted(() => ({ mockFlushSyncQueue: vi.fn(() => Promise.resolve()) }));
vi.mock('../../../services/flush-sync-queue', () => ({ flushSyncQueue: mockFlushSyncQueue }));

function renderSettings() {
  return render(
    <SettingsProvider>
      <SettingsView />
    </SettingsProvider>,
  );
}

afterEach(async () => {
  localStorage.clear();
  vi.clearAllMocks();
  await deleteDB('psykl');
});

describe('SettingsView — Offline Mode', () => {
  it('shows Offline Mode on by default', () => {
    // Arrange
    renderSettings();

    // Assert
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Keep a copy on this device and sync when online.')).toBeInTheDocument();
  });

  it('shows the switch as available, with no not-yet-available marker', () => {
    // Arrange
    renderSettings();

    // Assert
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).not.toHaveAttribute('data-available');
  });

  it('turns Offline Mode off and remembers it', async () => {
    // Arrange
    const user = userEvent.setup();
    renderSettings();

    // Act
    await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

    // Assert — the provider remounts the view once the flush ends, so query again
    await waitFor(() => expect(readOfflineMode()).toBe(false));
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');
    expect(mockFlushSyncQueue).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard focus on the switch after the remount', async () => {
    // Arrange
    const user = userEvent.setup();
    renderSettings();
    screen.getByRole('switch', { name: 'Offline Mode' }).focus();

    // Act
    await user.keyboard(' ');

    // Assert
    await waitFor(() => expect(readOfflineMode()).toBe(false));
    const offlineMode = screen.getByRole('switch', { name: 'Offline Mode' });
    expect(offlineMode).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(offlineMode).toHaveFocus());
  });

  it('disables the switch while changes are being sent', async () => {
    // Arrange
    let finish: () => void = () => {};
    mockFlushSyncQueue.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const user = userEvent.setup();
    renderSettings();

    // Act
    await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

    // Assert — sending
    const sending = screen.getByRole('switch', { name: 'Offline Mode' });
    expect(sending).toBeDisabled();
    expect(sending).toHaveAttribute('aria-busy', 'true');
    expect(sending).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Sending changes made on this device…')).toBeInTheDocument();
    expect(readOfflineMode()).toBe(true);

    // Act — the flush ends
    finish();

    // Assert — switched
    await waitFor(() => expect(readOfflineMode()).toBe(false));
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toBeEnabled();
    expect(screen.getByText('Keep a copy on this device and sync when online.')).toBeInTheDocument();
  });

  it('turns Offline Mode on without sending anything first', async () => {
    // Arrange
    writeOfflineMode(false);
    const user = userEvent.setup();
    renderSettings();

    // Act
    await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

    // Assert
    await waitFor(() => expect(readOfflineMode()).toBe(true));
    expect(mockFlushSyncQueue).not.toHaveBeenCalled();
  });
});
