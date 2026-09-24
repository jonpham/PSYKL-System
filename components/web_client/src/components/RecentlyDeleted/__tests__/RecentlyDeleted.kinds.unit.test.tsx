import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { putList, putTask } from '../../../db/idb';
import { RecentlyDeleted } from '../RecentlyDeleted';

const databaseName = 'psykl';
const deletedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const listId = '01940000-0000-7000-8000-0000000000a1';
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

afterEach(async () => {
  mockReplay.mockReset();
  await deleteDB(databaseName);
});

async function seedCascadedList(): Promise<void> {
  await putList({
    created_at: deletedAt,
    deleted_at: deletedAt,
    id: listId,
    position: 'a1',
    server_updated_at: deletedAt,
    title: 'Groceries',
    updated_at: deletedAt,
    user_id: 'local',
  });
  await putTask({
    completed_at: null,
    created_at: deletedAt,
    deleted_at: deletedAt,
    id: '01940000-0000-7000-8000-0000000000b1',
    list_id: listId,
    server_updated_at: deletedAt,
    title: 'Milk',
    updated_at: deletedAt,
    user_id: 'local',
  });
}

describe('RecentlyDeleted row kinds', () => {
  it('says a row was a list, and how many items come back with it', async () => {
    // Arrange
    await seedCascadedList();

    // Act
    render(<RecentlyDeleted open />);

    // Assert
    await waitFor(() => expect(screen.getByRole('listitem', { name: 'Groceries' })).toBeVisible());
    expect(screen.getByText('list · 1 item')).toBeVisible();
  });

  it('says a row was a task', async () => {
    // Arrange
    await seedCascadedList();

    // Act
    render(<RecentlyDeleted open />);

    // Assert
    await waitFor(() => expect(screen.getByRole('listitem', { name: 'Milk' })).toBeVisible());
    expect(screen.getByText('task')).toBeVisible();
  });

  it('leaves the item count off a list that was emptied before it went', async () => {
    // Arrange — a list deleted with nothing inside it
    await putList({
      created_at: deletedAt,
      deleted_at: deletedAt,
      id: listId,
      position: 'a1',
      server_updated_at: deletedAt,
      title: 'Errands',
      updated_at: deletedAt,
      user_id: 'local',
    });

    // Act
    render(<RecentlyDeleted open />);

    // Assert
    await waitFor(() => expect(screen.getByRole('listitem', { name: 'Errands' })).toBeVisible());
    expect(screen.getByText('list')).toBeVisible();
  });
});
