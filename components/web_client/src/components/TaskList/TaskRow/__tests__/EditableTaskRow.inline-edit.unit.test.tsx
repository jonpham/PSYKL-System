import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { listTasks, putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { EditableTaskRow } from '../EditableTaskRow';

const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return { ...actual, replay: mockReplay };
});

const databaseName = 'psykl';

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000b1',
  user_id: 'local',
  title: 'call the vet about the booster shot on Friday',
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
  await deleteDB(databaseName);
});

function renderRow() {
  return render(
    <ul>
      <EditableTaskRow task={baseTask} />
    </ul>,
  );
}

/**
 * A tapped title must land where the rendered title was. An `<input>` cannot
 * wrap, so a two-line title collapsed to one and the row lost a line of height
 * under the user's finger — the jump these tests pin shut.
 */
describe('EditableTaskRow inline title editing (Unit)', () => {
  it('opens a field that wraps, so a two-line title stays two lines', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRow();

    // Act
    await user.click(screen.getByRole('button', { name: /^edit /i }));

    // Assert — a textarea wraps; an input cannot
    const field = screen.getByRole('textbox', { name: /edit title/i });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue(baseTask.title);
  });

  it('keeps the field in the row box the rendered title occupied', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRow();
    const title = screen.getByRole('button', { name: /^edit /i });
    const titleClass = title.className;

    // Act
    await user.click(title);

    // Assert — same class, so it inherits the title's font, padding and wrapping
    expect(screen.getByRole('textbox', { name: /edit title/i })).toHaveClass(titleClass);
  });

  it('commits on Enter rather than inserting a newline', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRow();
    await user.click(screen.getByRole('button', { name: /^edit /i }));
    const field = screen.getByRole('textbox', { name: /edit title/i });

    // Act
    await user.clear(field);
    await user.type(field, 'call the vet{Enter}');

    // Assert — the field closed and the committed title carries no newline
    expect(screen.queryByRole('textbox', { name: /edit title/i })).not.toBeInTheDocument();
    await waitFor(async () => {
      expect(await listTasks()).toEqual([expect.objectContaining({ title: 'call the vet' })]);
    });
  });
});
