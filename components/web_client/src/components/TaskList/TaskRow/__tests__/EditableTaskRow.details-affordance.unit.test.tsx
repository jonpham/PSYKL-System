import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { EditableTaskRow } from '../EditableTaskRow';
import { SelectableTaskRow } from '../SelectableTaskRow';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000c1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-01T09:00:00.000Z',
  server_updated_at: '2026-06-01T09:00:00.500Z',
  deleted_at: null,
  list_id: null,
};

beforeEach(async () => {
  mockReplay.mockResolvedValue(undefined);
  await putTask(baseTask);
});

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB('psykl');
});

/**
 * The trailing slot is shared: outside selection it carries the details button,
 * inside selection it carries the drag handle. They are mutually exclusive by
 * construction, so a tap in that column can only ever mean one thing.
 */
describe('EditableTaskRow details affordance (Unit)', () => {
  it('offers no details button until the title is being edited', () => {
    // Arrange
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Assert
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });

  it('reveals the details button on the row whose title was tapped', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ul>
        <EditableTaskRow task={baseTask} />
      </ul>,
    );

    // Act
    await user.click(screen.getByRole('button', { name: /^edit walk the dog$/i }));

    // Assert
    expect(screen.getByRole('button', { name: /details for walk the dog/i })).toBeInTheDocument();
  });

  it('shows the drag handle and no details button in selection mode', () => {
    // Arrange
    render(
      <ul>
        <SelectableTaskRow onReorder={() => {}} onToggleSelect={() => {}} selected={false} task={baseTask} />
      </ul>,
    );

    // Assert
    expect(screen.getByRole('button', { name: /reorder walk the dog/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();
  });
});
