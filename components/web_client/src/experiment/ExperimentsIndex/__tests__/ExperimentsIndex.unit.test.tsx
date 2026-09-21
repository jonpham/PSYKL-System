import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { Experiment } from '../../registry.types';
import { ExperimentsIndex } from '../ExperimentsIndex';

const experiments: Experiment[] = [
  {
    Component: () => <p>sections</p>,
    slug: 'task-sections',
    status: 'exploring',
    summary: 'Group tasks under headings.',
    title: 'Task Sections',
  },
  {
    Component: () => <p>swipe</p>,
    slug: 'swipe-actions',
    status: 'paused',
    summary: 'Swipe a row to complete it.',
    title: 'Swipe Actions',
  },
];

describe('ExperimentsIndex', () => {
  it('tells the operator nothing is running when the registry is empty', () => {
    // Arrange / Act
    render(<ExperimentsIndex experiments={[]} />);

    // Assert
    expect(screen.getByText(/no experiments are registered/i)).toBeVisible();
  });

  it('lists every registered experiment with its status', () => {
    // Arrange / Act
    render(<ExperimentsIndex experiments={experiments} />);

    // Assert
    expect(screen.getByRole('button', { name: /Task Sections/ })).toBeVisible();
    expect(screen.getByText('Group tasks under headings.')).toBeVisible();
    expect(screen.getByText('paused')).toBeVisible();
  });

  it('opens an experiment when its entry is chosen', async () => {
    // Arrange
    const user = userEvent.setup();
    window.history.pushState({}, '', '/');
    render(<ExperimentsIndex experiments={experiments} />);

    // Act
    await user.click(screen.getByRole('button', { name: /Task Sections/ }));

    // Assert
    expect(window.location.pathname).toBe('/exp/task-sections');
  });
});
