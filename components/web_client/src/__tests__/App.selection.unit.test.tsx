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

async function enterSelectionMode(): Promise<void> {
  await userEvent.click(await screen.findByRole('button', { name: 'List options' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Select Items' }));
}

describe('App header in selection mode (Unit)', () => {
  it('hands the header over to leaving selection mode', async () => {
    // Arrange
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Sync clear' })).toBeInTheDocument();

    // Act
    await enterSelectionMode();

    // Assert — one way out, and nothing competing with it
    expect(screen.getByRole('button', { name: 'Done selecting' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sync clear' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'List options' })).not.toBeInTheDocument();
  });

  it('opens the list name for renaming only while selecting', async () => {
    // Arrange
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rename Tasks' })).not.toBeInTheDocument();

    // Act
    await enterSelectionMode();
    await userEvent.click(await screen.findByRole('button', { name: 'Rename Tasks' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'List name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'List name' }), 'Errands{Enter}');

    // Assert
    expect(await screen.findByRole('button', { name: 'Rename Errands' })).toBeInTheDocument();

    // Act — the name settles back into a plain heading on the way out
    await userEvent.click(screen.getByRole('button', { name: 'Done selecting' }));

    // Assert
    expect(await screen.findByRole('heading', { name: 'Errands' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rename Errands' })).not.toBeInTheDocument();
  });

  it('restores the ordinary header on the way out', async () => {
    // Arrange
    render(<App />);
    await enterSelectionMode();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Done selecting' }));

    // Assert
    expect(await screen.findByRole('button', { name: 'List options' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done selecting' })).not.toBeInTheDocument();
    // The sync control comes back with the ordinary header; its label tracks
    // the queue, so match the control rather than one of its two states.
    expect(await screen.findByRole('button', { name: /^Sync (clear|needs attention)$/ })).toBeInTheDocument();
  });
});
