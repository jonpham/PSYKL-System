import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { experimentToolsStore } from '../experiment';
import { navigate } from '../hooks/usePathname';
import { Root } from '../Root';

afterEach(() => {
  window.history.pushState({}, '', '/');
  window.localStorage.clear();
});

describe('Root', () => {
  it('renders the production app at the root path', async () => {
    // Arrange
    window.history.pushState({}, '', '/');

    // Act
    render(<Root />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    });
  });

  it('renders the experiment surface under /exp', async () => {
    // Arrange
    window.history.pushState({}, '', '/exp');

    // Act
    render(<Root />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    });
    expect(screen.queryByRole('heading', { name: 'PSYKL' })).toBeNull();
  });

  it('swaps surfaces when the operator navigates', async () => {
    // Arrange
    window.history.pushState({}, '', '/');
    render(<Root />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    });

    // Act
    navigate('/exp');

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Experiments' })).toBeVisible();
    });
  });

  it('keeps the experiment tools off production for anyone who never opened an experiment', async () => {
    // Arrange
    window.history.pushState({}, '', '/');

    // Act
    render(<Root />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    });
    expect(screen.queryByLabelText('Experiment controls')).toBeNull();
  });

  it('shows the experiment tools over production once they are on', async () => {
    // Arrange
    experimentToolsStore.write(true);
    window.history.pushState({}, '', '/');

    // Act
    render(<Root />);

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText('Experiment controls')).toBeVisible();
    });
  });
});
