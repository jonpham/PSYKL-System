import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import App from '../App';
import { SettingsProvider } from '../components/SettingsProvider';
import { resetUseListsForTest } from '../hooks/useLists';
import { resetUseTasksForTest } from '../hooks/useTasks';
import { writeOfflineMode } from '../preferences/offlineMode';

afterEach(async () => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
  resetUseTasksForTest();
  resetUseListsForTest();
  await deleteDB('psykl');
});

describe('App with Offline Mode off', () => {
  it('renders the shell and the server’s empty list', async () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Open PSYKL navigation' })).toBeInTheDocument();
    expect(await screen.findByText(/nothing to do yet/i)).toBeInTheDocument();
  });

  it('offers no Sync control in the header or the navigation', async () => {
    // Arrange
    writeOfflineMode(false);

    // Act
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>,
    );
    await screen.findByText(/nothing to do yet/i);

    // Assert
    expect(screen.queryByRole('button', { name: /^Sync (clear|needs attention)$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sync' })).not.toBeInTheDocument();
  });

  it('takes a visit to Sync to the list instead', async () => {
    // Arrange
    writeOfflineMode(false);
    window.history.pushState({}, '', '/sync');

    // Act
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>,
    );

    // Assert
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(await screen.findByText(/nothing to do yet/i)).toBeInTheDocument();
  });

  it('replaces a visit to Sync, so going back leaves the app instead of returning to it', async () => {
    // Arrange
    writeOfflineMode(false);
    window.history.pushState({}, '', '/sync');
    const entries = window.history.length;

    // Act
    render(
      <SettingsProvider>
        <App />
      </SettingsProvider>,
    );

    // Assert
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(window.history.length).toBe(entries);
  });
});
