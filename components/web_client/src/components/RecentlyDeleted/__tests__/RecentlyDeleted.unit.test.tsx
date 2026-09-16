import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { v7 as uuidv7 } from 'uuid';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { putTask } from '../../../db/idb';
import { RecentlyDeleted } from '../RecentlyDeleted';

const databaseName = 'psykl';
const dayMs = 24 * 60 * 60 * 1000;
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

afterEach(async () => {
  mockReplay.mockReset();
  await deleteDB(databaseName);
});

describe('RecentlyDeleted', () => {
  it('shows "Nothing deleted in the last 30 days." when empty', async () => {
    // Arrange / Act
    render(<RecentlyDeleted open />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
    });
  });

  it('shows a deleted Task with its remaining days and restores it', async () => {
    // Arrange
    const taskId = uuidv7();
    const deletedAt = new Date(Date.now() - 2 * dayMs).toISOString();
    await putTask({
      id: taskId,
      user_id: 'local',
      title: 'Milk',
      created_at: deletedAt,
      completed_at: null,
      updated_at: deletedAt,
      server_updated_at: deletedAt,
      deleted_at: deletedAt,
      list_id: null,
    });
    render(<RecentlyDeleted open />);
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'Milk' })).toBeVisible();
    });
    expect(screen.getByText('28d')).toBeVisible();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Restore Milk' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nothing deleted in the last 30 days.')).toBeVisible();
    });
  });
});
