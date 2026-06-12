import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { listTasks } from '../../../db/idb';
import { resetUseTasksForTest } from '../../../hooks/useTasks';
import { TaskCreateForm } from '../TaskCreateForm';

const databaseName = 'psykl';

afterEach(async () => {
  resetUseTasksForTest();
  await deleteDB(databaseName);
});

describe('TaskCreateForm (Unit)', () => {
  it('renders an input and a Create button', () => {
    render(<TaskCreateForm />);

    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('disables the button when the title is empty', () => {
    render(<TaskCreateForm />);

    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('enables the button when the title has content', async () => {
    const user = userEvent.setup();
    render(<TaskCreateForm />);

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'hi');

    expect(screen.getByRole('button', { name: /create/i })).toBeEnabled();
  });

  it('persists the created task in IndexedDB after a successful submit', async () => {
    const user = userEvent.setup();
    render(<TaskCreateForm />);

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'created locally');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(async () => {
      expect(await listTasks()).toEqual([expect.objectContaining({ title: 'created locally' })]);
    });
    await waitFor(() => expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue(''));
  });
});
