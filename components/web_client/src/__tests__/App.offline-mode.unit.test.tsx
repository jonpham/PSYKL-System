import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import App from '../App';
import { SettingsProvider } from '../components/SettingsProvider';
import { resetUseListsForTest } from '../hooks/useLists';
import { resetUseTasksForTest } from '../hooks/useTasks';
import { writeOfflineMode } from '../preferences/offlineMode';

afterEach(async () => {
  localStorage.clear();
  resetUseTasksForTest();
  resetUseListsForTest();
  await deleteDB('psykl');
});

describe('App with Offline Mode off', () => {
  it('renders the shell and an empty list instead of crashing on the stubbed path', async () => {
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
});
