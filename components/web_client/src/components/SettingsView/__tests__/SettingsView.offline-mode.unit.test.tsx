import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { readOfflineMode } from '../../../preferences/offlineMode';
import { SettingsProvider } from '../../SettingsProvider';
import { SettingsView } from '../SettingsView';

function renderSettings() {
  return render(
    <SettingsProvider>
      <SettingsView />
    </SettingsProvider>,
  );
}

afterEach(async () => {
  localStorage.clear();
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

  it('marks the switch as not yet functional while the online path is stubbed', () => {
    // Arrange
    renderSettings();

    // Assert
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('data-available', 'false');
  });

  it('turns Offline Mode off and remembers it', async () => {
    // Arrange
    const user = userEvent.setup();
    renderSettings();

    // Act
    await user.click(screen.getByRole('switch', { name: 'Offline Mode' }));

    // Assert — the provider remounts the view, so query again
    expect(screen.getByRole('switch', { name: 'Offline Mode' })).toHaveAttribute('aria-checked', 'false');
    expect(readOfflineMode()).toBe(false);
  });
});
