import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { navigate } from '../hooks/usePathname';
import { Root } from '../Root';

afterEach(() => {
  window.history.pushState({}, '', '/');
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
});
