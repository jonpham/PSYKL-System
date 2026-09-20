import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Experiment } from '../../registry.types';
import { ExperimentRouter } from '../ExperimentRouter';

const experiments: Experiment[] = [
  {
    Component: () => <p>sections body</p>,
    slug: 'task-sections',
    status: 'exploring',
    summary: 'Group tasks under headings.',
    title: 'Task Sections',
  },
];

describe('ExperimentRouter', () => {
  it('renders the matching experiment inside the experiment frame', () => {
    // Arrange / Act
    render(<ExperimentRouter experiments={experiments} pathname="/exp/task-sections" />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Task Sections' })).toBeVisible();
    expect(screen.getByText('sections body')).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(/experiment/i);
  });

  it('lists the experiments at the index route', () => {
    // Arrange / Act
    render(<ExperimentRouter experiments={experiments} pathname="/exp" />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Task Sections/ })).toBeVisible();
  });

  it('falls back to the index when the slug is not registered', () => {
    // Arrange / Act
    render(<ExperimentRouter experiments={experiments} pathname="/exp/does-not-exist" />);

    // Assert
    expect(screen.getByText(/no experiment is registered at/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /Task Sections/ })).toBeVisible();
  });
});
