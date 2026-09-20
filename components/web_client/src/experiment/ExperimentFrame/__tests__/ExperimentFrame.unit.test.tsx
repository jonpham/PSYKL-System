import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ExperimentFrame } from '../ExperimentFrame';

describe('ExperimentFrame', () => {
  it('marks the surface as an experiment so it is never mistaken for the product', () => {
    // Arrange / Act
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Assert
    expect(screen.getByRole('heading', { name: 'Task Sections' })).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(/experiment/i);
    expect(screen.getByText('body')).toBeVisible();
  });

  it('offers a way back to the production app', async () => {
    // Arrange
    const user = userEvent.setup();
    window.history.pushState({}, '', '/exp/task-sections');
    render(<ExperimentFrame title="Task Sections">body</ExperimentFrame>);

    // Act
    await user.click(screen.getByRole('button', { name: /back to psykl/i }));

    // Assert
    expect(window.location.pathname).toBe('/');
  });
});
