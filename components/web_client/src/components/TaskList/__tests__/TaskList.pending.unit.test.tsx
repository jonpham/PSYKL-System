// TaskList only reads the pending queue where IndexedDB exists (TaskList.tsx),
// so the guard needs a real implementation present for this suite.
import 'fake-indexeddb/auto';

import { act, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Task } from '../../../api/client';
import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockListPending = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({ useTasks: mockUseTasks }));
vi.mock('../../../services/task-service-client', () => ({
  taskServiceClient: { listPending: mockListPending },
}));
vi.mock('../../../hooks/useCompletedVisibility', () => ({
  useCompletedVisibility: () => ({ setShowCompleted: () => {}, showCompleted: true }),
}));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({
  useSyncDiscrepancy: () => ({ count: 0, level: 'ok' }),
}));

const queuedTaskId = '01940000-0000-7000-8000-000000000010';
const tasks: Task[] = [
  {
    id: queuedTaskId,
    user_id: 'local',
    title: 'queued task',
    created_at: '2026-05-27T12:00:00.000Z',
    completed_at: null,
    updated_at: '2026-05-27T12:00:00.000Z',
    server_updated_at: '2026-05-27T12:00:00.500Z',
    deleted_at: null,
    list_id: null,
  },
];

/**
 * The queue-to-row plumbing for the pending affordance.
 *
 * This lives at the Unit layer on fake timers deliberately: the Storybook
 * version of it shared one browser tab with every other story, so a replay left
 * behind by an earlier story could drain the queue and the 2s threshold then
 * had to be met against a real clock on a contended runner. Neither condition
 * says anything about the behaviour under test.
 */
describe('TaskList pending affordance (Unit)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockUseTasks.mockReturnValue({ error: null, loading: false, tasks });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('marks a row pending once its queued op has stood for the threshold', async () => {
    // Arrange
    mockListPending.mockResolvedValue([queuedTaskId]);

    // Act
    render(<TaskList />);
    const item = await screen.findByRole('listitem', { name: /queued task/i });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Assert
    expect(item).toHaveAttribute('data-pending', 'true');
    expect(within(item).getByLabelText(/pending sync/i)).toBeInTheDocument();
  });

  it('leaves a row plain while nothing is queued for it', async () => {
    // Arrange
    mockListPending.mockResolvedValue([]);

    // Act
    render(<TaskList />);
    const item = await screen.findByRole('listitem', { name: /queued task/i });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Assert — the affordance is for work that is stuck, not for every row
    expect(item).toHaveAttribute('data-pending', 'false');
    expect(within(item).queryByLabelText(/pending sync/i)).not.toBeInTheDocument();
  });

  it('holds the affordance back until the threshold elapses', async () => {
    // Arrange — a sync that lands quickly should never flash a dimmed row
    mockListPending.mockResolvedValue([queuedTaskId]);

    // Act
    render(<TaskList />);
    const item = await screen.findByRole('listitem', { name: /queued task/i });
    await waitFor(() => expect(mockListPending).toHaveBeenCalled());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1900);
    });

    // Assert
    expect(item).toHaveAttribute('data-pending', 'false');
  });
});
