import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskList } from '../TaskList';

const mockUseTasks = vi.hoisted(() => vi.fn());
const mockUseSyncDiscrepancy = vi.hoisted(() => vi.fn());

vi.mock('../../../hooks/useTasks', () => ({ useTasks: mockUseTasks }));
vi.mock('../../../hooks/useSyncDiscrepancy', () => ({ useSyncDiscrepancy: mockUseSyncDiscrepancy }));

describe('TaskList capture (Unit)', () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({ createTask: vi.fn(), error: null, loading: false, tasks: [] });
    mockUseSyncDiscrepancy.mockReturnValue({ count: 0, level: 'ok' });
  });

  it('opens a capture row from the add control', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskList />);

    // Act
    await user.click(screen.getByRole('button', { name: 'New Task' }));

    // Assert
    expect(screen.getByRole('textbox', { name: 'New task title' })).toBeInTheDocument();
  });

  it('refuses new capture once the offline write ceiling is reached', () => {
    // Arrange — the device has more queued changes than it may safely hold
    mockUseSyncDiscrepancy.mockReturnValue({ count: 100, level: 'ceiling' });

    // Act
    render(<TaskList />);

    // Assert — the control says why rather than failing silently on press
    const add = screen.getByRole('button', { name: 'Reconnect to keep adding.' });
    expect(add).toBeDisabled();
  });
});
