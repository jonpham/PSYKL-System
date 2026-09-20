import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExperimentFrame } from '../ExperimentFrame';

describe('ExperimentFrame', () => {
  it('marks the surface with compact experiment controls by default', () => {
    // Arrange / Act
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Assert
    expect(screen.getByRole('heading', { name: 'Task Sections' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Expand experiment controls' })).toHaveTextContent('🧪');
    expect(screen.getByRole('button', { name: 'Expand experiment controls' })).not.toHaveTextContent('Experiment');
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getByText('body')).toBeVisible();
  });

  it('expands and collapses the experiment toolbar', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Act
    await user.click(screen.getByRole('button', { name: 'Expand experiment controls' }));

    // Assert
    expect(screen.getByRole('note')).toHaveTextContent(/not production/i);
    expect(screen.getByRole('button', { name: 'Close experiment' })).toBeVisible();
    expect(screen.getByLabelText('Experiment controls')).toHaveStyle({ alignItems: 'center', display: 'flex' });

    // Act
    await user.click(screen.getByRole('button', { name: 'Collapse experiment controls' }));

    // Assert
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('offers a way back to the production app from the expanded toolbar', async () => {
    // Arrange
    const user = userEvent.setup();
    window.history.pushState({}, '', '/exp/task-sections');
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Act
    await user.click(screen.getByRole('button', { name: 'Expand experiment controls' }));
    await user.click(screen.getByRole('button', { name: 'Close experiment' }));

    // Assert
    expect(window.location.pathname).toBe('/');
  });

  it('lets a full-layout experiment own the viewport width', () => {
    // Arrange / Act
    render(
      <ExperimentFrame layout="full" title="Apple Reminders UX">
        body
      </ExperimentFrame>,
    );

    // Assert
    expect(screen.getByRole('main')).toHaveStyle({ margin: '0', maxWidth: 'none', padding: '0' });
    expect(screen.getByLabelText('Experiment controls')).toHaveStyle({ position: 'fixed' });
  });
});
