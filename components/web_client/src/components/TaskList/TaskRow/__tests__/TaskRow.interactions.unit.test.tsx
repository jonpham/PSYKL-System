import 'fake-indexeddb/auto';

import { act, render, screen, within } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../../api/client';
import { putTask } from '../../../../db/idb';
import { resetUseTasksForTest } from '../../../../hooks/useTasks';
import { EditableTaskRow } from '../EditableTaskRow';

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
  list_id: null,
};

function renderRow(isPending = false) {
  return render(
    <ul>
      <EditableTaskRow isPending={isPending} task={baseTask} />
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
        <EditableTaskRow isPending={false} task={baseTask} />
      </ul>,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Then the dot never appears
    expect(screen.queryByLabelText(/^pending sync$/i)).not.toBeInTheDocument();
  });
});
