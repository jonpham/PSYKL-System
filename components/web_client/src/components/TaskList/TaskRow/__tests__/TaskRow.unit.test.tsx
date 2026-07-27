import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { listSyncQueue, listTasks, putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { TaskRow } from '../TaskRow';

// Replay is mocked to a no-op so the enqueued sync op stays in the queue for
// assertion; the real enqueue path still writes through IndexedDB.
const mockReplay = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock('../../../../sync/replay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../sync/replay')>();
  return {
    ...actual,
    replay: mockReplay,
  };
});

const databaseName = 'psykl';

const baseTask: Task = {
  id: '01940000-0000-7000-8000-0000000000a1',
  user_id: 'local',
  title: 'walk the dog',
  created_at: '2026-06-01T09:00:00.000Z',
  completed_at: null,
  updated_at: '2026-06-01T09:00:00.000Z',
  server_updated_at: '2026-06-01T09:00:00.500Z',
  deleted_at: null,
};

function renderRow(task: Task = baseTask, isPending = false) {
  return render(
    <ul>
      <TaskRow isPending={isPending} task={task} />
    </ul>,
  );
}

beforeEach(async () => {
  mockReplay.mockResolvedValue(undefined);
  await putTask(baseTask);
});

afterEach(async () => {
  vi.useRealTimers();
  mockReplay.mockReset();
  resetUseTasksForTest();
  await deleteDB(databaseName);
});

describe('TaskRow (Unit)', () => {
  describe('inline title edit', () => {
    it('shows an editable input when the title is clicked', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();

      // When
      await user.click(screen.getByRole('button', { name: /edit walk the dog/i }));

      // Then
      expect(screen.getByRole('textbox', { name: /edit title/i })).toHaveValue('walk the dog');
    });

    it('enqueues a patch with the new title and updated_at on Enter', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();
      await user.click(screen.getByRole('button', { name: /edit walk the dog/i }));

      // When
      const input = screen.getByRole('textbox', { name: /edit title/i });
      await user.clear(input);
      await user.type(input, 'walk the cat{Enter}');

      // Then
      await waitFor(async () => {
        expect(await listTasks()).toEqual([expect.objectContaining({ title: 'walk the cat' })]);
      });
      const queue = await listSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ op: 'patch', task_id: baseTask.id });
      const body = queue[0]?.body as { title?: string; updated_at?: string };
      expect(body.title).toBe('walk the cat');
      expect(body.updated_at).toEqual(expect.any(String));
      expect(body.updated_at).not.toEqual(baseTask.updated_at);
    });

    it('saves the edited title on blur', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();
      await user.click(screen.getByRole('button', { name: /edit walk the dog/i }));

      // When
      const input = screen.getByRole('textbox', { name: /edit title/i });
      await user.clear(input);
      await user.type(input, 'walk the fish');
      await user.tab();

      // Then
      await waitFor(async () => {
        expect(await listTasks()).toEqual([expect.objectContaining({ title: 'walk the fish' })]);
      });
    });

    it('cancels the edit and enqueues nothing on Escape', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();
      await user.click(screen.getByRole('button', { name: /edit walk the dog/i }));

      // When
      const input = screen.getByRole('textbox', { name: /edit title/i });
      await user.clear(input);
      await user.type(input, 'discarded{Escape}');

      // Then
      expect(screen.getByRole('button', { name: /edit walk the dog/i })).toBeInTheDocument();
      expect(await listSyncQueue()).toHaveLength(0);
      expect(await listTasks()).toEqual([expect.objectContaining({ title: 'walk the dog' })]);
    });

    it('enqueues nothing when the title is unchanged', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();
      await user.click(screen.getByRole('button', { name: /edit walk the dog/i }));

      // When
      await user.keyboard('{Enter}');

      // Then
      expect(await listSyncQueue()).toHaveLength(0);
    });
  });

  describe('complete toggle', () => {
    it('enqueues a patch setting completed_at when marked complete', async () => {
      // Given
      const user = userEvent.setup();
      renderRow();

      // When
      await user.click(screen.getByRole('checkbox', { name: /mark walk the dog complete/i }));

      // Then
      const queue = await listSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ op: 'patch', task_id: baseTask.id });
      const body = queue[0]?.body as { completed_at?: string | null; updated_at?: string };
      expect(body.completed_at).toEqual(expect.any(String));
      expect(body.updated_at).toEqual(expect.any(String));
      await waitFor(async () => {
        expect((await listTasks())[0]?.completed_at).toEqual(expect.any(String));
      });
    });

    it('enqueues a patch clearing completed_at when a completed task is unmarked', async () => {
      // Given
      const completed: Task = {
        ...baseTask,
        completed_at: '2026-06-01T10:00:00.000Z',
      };
      await putTask(completed);
      const user = userEvent.setup();
      renderRow(completed);

      // When
      await user.click(screen.getByRole('checkbox', { name: /mark walk the dog incomplete/i }));

      // Then
      const queue = await listSyncQueue();
      expect(queue).toHaveLength(1);
      const body = queue[0]?.body as { completed_at?: string | null };
      expect(body.completed_at).toBeNull();
      await waitFor(async () => {
        expect((await listTasks())[0]?.completed_at).toBeNull();
      });
    });
  });
});
