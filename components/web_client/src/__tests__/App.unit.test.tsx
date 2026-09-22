import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import App from '../App';
import { resetUseListsForTest } from '../hooks/useLists';
import { resetUseTasksForTest } from '../hooks/useTasks';

const databaseName = 'psykl';

afterEach(async () => {
  resetUseTasksForTest();
  resetUseListsForTest();
  await deleteDB(databaseName);
});

describe('App shell', () => {
  it('renders the production navigation header', async () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Open PSYKL navigation' })).toBeInTheDocument();
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders a placeholder section for the Task UI', async () => {
    render(<App />);
    expect(screen.getByTestId('task-ui-slot')).toBeInTheDocument();
    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('reaches Recently Deleted from navigation', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: 'Recently Deleted' }));

    // A destination, not a sheet: leaving it is navigation, not a Close button.
    expect(await screen.findByRole('region', { name: 'Recently Deleted' })).toBeVisible();
  });
});
