import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TaskCreateForm } from '../TaskCreateForm';

describe('TaskCreateForm (Unit)', () => {
  it('renders an input and a Create button', () => {
    render(<TaskCreateForm onCreated={() => {}} />);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('disables the button when the title is empty', () => {
    render(<TaskCreateForm onCreated={() => {}} />);

    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('enables the button when the title has content', async () => {
    const user = userEvent.setup();
    render(<TaskCreateForm onCreated={() => {}} />);

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'hi');

    expect(screen.getByRole('button', { name: /create/i })).toBeEnabled();
  });
});
