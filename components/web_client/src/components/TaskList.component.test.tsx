import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('TaskList (Component, integrated with TaskCreateForm via MSW)', () => {
  it('shows newly created tasks in the list after Create', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'first');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText('first')).toBeInTheDocument();
    expect(screen.queryByText(/no tasks yet/i)).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'second');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText('second')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
  });
});
