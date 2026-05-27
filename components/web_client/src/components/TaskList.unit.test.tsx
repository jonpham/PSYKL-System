import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Task } from '../api/client';
import { TaskList } from './TaskList';

const sampleTasks: Task[] = [
  {
    id: '01940000-0000-7000-8000-000000000001',
    user_id: 'local',
    title: 'one',
    created_at: '2026-05-20T12:00:00.000Z',
  },
  {
    id: '01940000-0000-7000-8000-000000000002',
    user_id: 'local',
    title: 'two',
    created_at: '2026-05-20T12:01:00.000Z',
  },
];

describe('TaskList (Unit)', () => {
  it('renders each task title', () => {
    render(<TaskList tasks={sampleTasks} loading={false} error={null} />);

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });

  it('renders an empty-state message when there are no tasks', () => {
    render(<TaskList tasks={[]} loading={false} error={null} />);

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('renders a loading state when loading is true', () => {
    render(<TaskList tasks={[]} loading={true} error={null} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders an error message when error is set', () => {
    render(<TaskList tasks={[]} loading={false} error="boom" />);

    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });
});
