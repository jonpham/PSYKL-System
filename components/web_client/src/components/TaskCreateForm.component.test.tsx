import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskCreateForm } from './TaskCreateForm';

describe('TaskCreateForm (Component, with MSW)', () => {
  it('POSTs to /tasks and calls onCreated with the new Task', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<TaskCreateForm onCreated={onCreated} />);

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'integration test');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onCreated.mock.calls[0]?.[0]).toMatchObject({
      title: 'integration test',
      user_id: 'local',
    });
  });

  it('clears the input after a successful create', async () => {
    const user = userEvent.setup();
    render(<TaskCreateForm onCreated={() => {}} />);
    const input = screen.getByRole('textbox', { name: /title/i }) as HTMLInputElement;

    await user.type(input, 'clear me');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => expect(input.value).toBe(''));
  });
});
