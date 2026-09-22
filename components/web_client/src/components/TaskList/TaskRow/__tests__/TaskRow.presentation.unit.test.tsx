import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { TaskRow } from '../TaskRow';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000b1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-01T09:00:00.000Z',
  server_updated_at: '2026-06-01T09:00:00.500Z',
  deleted_at: null,
  list_id: null,
};

function renderRow(task: Task = baseTask) {
  return render(
    <ul>
      <TaskRow task={task} />
    </ul>,
  );
}

beforeEach(async () => {
  mockReplay.mockResolvedValue(undefined);
  await putTask(baseTask);
});

afterEach(async () => {
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB('psykl');
});

describe('TaskRow presentation (Unit)', () => {
  it('reads as an unchecked checkbox while the task is open', () => {
    // Arrange
    renderRow();

    // Assert
    const control = screen.getByRole('checkbox', { name: 'Mark walk the dog complete' });
    expect(control).toHaveAttribute('aria-checked', 'false');
  });

  it('reads as a checked checkbox once the task is completed', () => {
    // Arrange
    renderRow({ ...baseTask, completed_at: '2026-06-01T10:00:00.000Z' });

    // Assert
    const control = screen.getByRole('checkbox', { name: 'Mark walk the dog incomplete' });
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('marks the row completed so the struck title and sunk position have a styling hook', () => {
    // Arrange
    renderRow({ ...baseTask, completed_at: '2026-06-01T10:00:00.000Z' });

    // Assert
    expect(screen.getByRole('listitem')).toHaveAttribute('data-completed', 'true');
  });

  it('styles the row through classes rather than inline style rules', () => {
    // Arrange
    renderRow();

    // Assert — tokens live in the stylesheet; an inline style cannot read them
    const row = screen.getByRole('listitem');
    expect(row).toHaveClass('psykl-task-row');
    expect(row.getAttribute('style')).toBeNull();
  });
});
