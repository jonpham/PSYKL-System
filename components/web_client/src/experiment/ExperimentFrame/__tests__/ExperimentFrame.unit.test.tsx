import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { experimentToolsStore } from '../../experimentToolsStore';
import { ExperimentFrame } from '../ExperimentFrame';

afterEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

describe('ExperimentFrame', () => {
  it('marks the surface with compact experiment controls by default', () => {
    // Arrange / Act
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Assert
    expect(screen.getByRole('heading', { name: 'Task Sections' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Expand experiment controls' })).toHaveTextContent('🧪');
    expect(screen.getByText('body')).toBeVisible();
  });

  it('turns the experiment tools on so they follow the developer into production', () => {
    // Given a developer who has never opened an experiment
    expect(experimentToolsStore.read()).toBe(false);

    // When
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Then
    expect(experimentToolsStore.read()).toBe(true);
  });

  it('lets a full-layout experiment own the viewport width', () => {
    // Arrange / Act
    render(
      <ExperimentFrame layout="full" title="Sample Experiment">
        body
      </ExperimentFrame>,
    );

    // Assert
    expect(screen.getByRole('main')).toHaveStyle({ margin: '0', maxWidth: 'none', padding: '0' });
    expect(screen.getByLabelText('Experiment controls')).toHaveStyle({ position: 'fixed' });
  });
});
