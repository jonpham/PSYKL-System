import 'fake-indexeddb/auto';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { listSyncQueue, putTask } from '../../../../db/idb';
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

function renderRow(isPending = false) {
  return render(
    <ul>
      <TaskRow isPending={isPending} task={baseTask} />
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

describe('TaskRow delete confirmation (Unit)', () => {
  it('does not enqueue a delete on the first click', async () => {
    // Given
    const user = userEvent.setup();
    renderRow();

    // When
    await user.click(screen.getByRole('button', { name: /^delete walk the dog/i }));

    // Then
    expect(screen.getByRole('button', { name: /confirm delete walk the dog/i })).toBeInTheDocument();
    expect(await listSyncQueue()).toHaveLength(0);
  });

  it('enqueues a delete op on the second click within the confirm window', async () => {
    // Given
    const user = userEvent.setup();
    renderRow();

    // When
    await user.click(screen.getByRole('button', { name: /^delete walk the dog/i }));
    await user.click(screen.getByRole('button', { name: /confirm delete walk the dog/i }));

    // Then
    const queue = await listSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ op: 'delete', entity_type: 'task', entity_id: baseTask.id });
    const body = queue[0]?.body as { deleted_at?: string; updated_at?: string };
    expect(body.deleted_at).toEqual(expect.any(String));
    expect(body.updated_at).toEqual(expect.any(String));
  });

  it('disarms the confirmation after the 3-second window elapses', () => {
    // Given — fireEvent (not userEvent) so the test never awaits under fake timers.
    vi.useFakeTimers();
    renderRow();
    fireEvent.click(screen.getByRole('button', { name: /^delete walk the dog/i }));
    expect(screen.getByRole('button', { name: /confirm delete walk the dog/i })).toBeInTheDocument();

    // When
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Then
    expect(screen.getByRole('button', { name: /^delete walk the dog/i })).toBeInTheDocument();
  });
});

describe('TaskRow pending sync affordance (Unit)', () => {
  it('shows the pending affordance only after the 2s threshold', () => {
    // Given a row that is pending
    vi.useFakeTimers();
    renderRow(true);

    // Then before the threshold there is no dot and the row label is plain
    expect(screen.queryByLabelText(/^pending sync$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'walk the dog' })).toBeInTheDocument();

    // When the threshold elapses
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Then the dimmed row + dot appear
    const item = screen.getByRole('listitem', { name: /walk the dog pending sync/i });
    expect(within(item).getByLabelText(/^pending sync$/i)).toBeInTheDocument();
  });

  it('never shows the dot if the row stops being pending before the threshold', () => {
    // Given a row that is pending
    vi.useFakeTimers();
    const view = renderRow(true);

    // When it syncs (stops pending) before the threshold elapses
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    view.rerender(
      <ul>
        <TaskRow isPending={false} task={baseTask} />
      </ul>,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Then the dot never appears
    expect(screen.queryByLabelText(/^pending sync$/i)).not.toBeInTheDocument();
  });
});
