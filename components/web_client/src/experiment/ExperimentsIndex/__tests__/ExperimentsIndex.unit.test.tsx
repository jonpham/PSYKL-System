import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { Experiment } from '../../registry.types';
import { ExperimentsIndex } from '../ExperimentsIndex';

const experiments: Experiment[] = [
  {
    Component: () => <p>sections</p>,
    slug: 'task-sections',
    summary: 'Group tasks under headings.',
    title: 'Task Sections',
  },
  {
    Component: () => <p>swipe</p>,
    slug: 'swipe-actions',
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

  it('gives every registered experiment its own row', () => {
    // Arrange / Act
    render(<ExperimentsIndex experiments={experiments} />);

    // Assert
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAccessibleName(/Task Sections/);
    expect(rows[0]).toHaveTextContent('Group tasks under headings.');
    expect(rows[1]).toHaveAccessibleName(/Swipe Actions/);
  });

  it('follows the theme instead of pinning its own colors', () => {
    // Given a dark surface, where an inherited user-agent button color is invisible
    render(<ExperimentsIndex experiments={experiments} />);

    // When / Then
    expect(screen.getAllByRole('button')[0]).toHaveStyle({ color: 'var(--text-primary, #000)' });
  });

  it('opens an experiment when its row is chosen', async () => {
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
