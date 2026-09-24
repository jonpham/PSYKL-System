import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { experimentToolsStore } from '../../experimentToolsStore';
import type { Experiment } from '../../registry.types';
import { ExperimentTools } from '../ExperimentTools';

const experiments: Experiment[] = [
  {
    Component: () => <p>sample</p>,
    slug: 'sample-experiment',
    summary: 'A registered experiment.',
    title: 'Sample Experiment',
  },
];

afterEach(() => {
  window.history.pushState({}, '', '/');
  window.localStorage.clear();
});

async function expand() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Expand experiment controls' }));
  return user;
}

describe('ExperimentTools', () => {
  it('starts collapsed as a single experiment button', () => {
    // Arrange / Act
    render(<ExperimentTools experiments={experiments} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Expand experiment controls' })).toHaveTextContent('🧪');
    expect(screen.queryByRole('button', { name: /switch experience/i })).toBeNull();
  });

  it('names the production experience when the developer is on a production route', async () => {
    // Arrange
    window.history.pushState({}, '', '/');
    render(<ExperimentTools experiments={experiments} />);

    // Act
    await expand();

    // Assert
    expect(screen.getByRole('button', { name: /switch experience/i })).toHaveTextContent('Production');
  });

  it('names the experiment the developer is currently inside', async () => {
    // Arrange
    window.history.pushState({}, '', '/exp/sample-experiment');
    render(<ExperimentTools experiments={experiments} />);

    // Act
    await expand();

    // Assert
    expect(screen.getByRole('button', { name: /switch experience/i })).toHaveTextContent('Sample Experiment');
  });

  it('switches to an experiment chosen from the picker', async () => {
    // Arrange
    window.history.pushState({}, '', '/');
    render(<ExperimentTools experiments={experiments} />);
    const user = await expand();

    // Act
    await user.click(screen.getByRole('button', { name: /switch experience/i }));
    await user.click(screen.getByRole('button', { name: /Sample Experiment/ }));

    // Assert
    expect(window.location.pathname).toBe('/exp/sample-experiment');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('turns the tools off and returns to production when closed', async () => {
    // Arrange
    experimentToolsStore.write(true);
    window.history.pushState({}, '', '/exp/sample-experiment');
    render(<ExperimentTools experiments={experiments} />);
    const user = await expand();

    // Act
    await user.click(screen.getByRole('button', { name: 'Close experiment tools' }));

    // Assert
    expect(window.location.pathname).toBe('/');
    expect(experimentToolsStore.read()).toBe(false);
  });

  it('collapses back to the single button', async () => {
    // Arrange
    render(<ExperimentTools experiments={experiments} />);
    const user = await expand();

    // Act
    await user.click(screen.getByRole('button', { name: 'Collapse experiment controls' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Expand experiment controls' })).toBeVisible();
  });
});
