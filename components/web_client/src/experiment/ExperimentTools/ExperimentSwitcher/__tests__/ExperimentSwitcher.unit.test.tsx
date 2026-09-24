import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Experiment } from '../../../registry.types';
import { ExperimentSwitcher } from '../ExperimentSwitcher';

const experiments: Experiment[] = [
  {
    Component: () => <p>sample</p>,
    slug: 'sample-experiment',
    summary: 'A registered experiment.',
    title: 'Sample Experiment',
  },
];

function renderSwitcher(overrides: { currentSlug?: string | null } = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  render(
    <ExperimentSwitcher
      currentSlug={overrides.currentSlug ?? null}
      experiments={experiments}
      onClose={onClose}
      onSelect={onSelect}
    />,
  );
  return { onClose, onSelect, user: userEvent.setup() };
}

describe('ExperimentSwitcher', () => {
  it('always offers production alongside every registered experiment', () => {
    // Arrange / Act
    renderSwitcher();

    // Assert
    expect(screen.getByRole('dialog', { name: 'Switch experience' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Production/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Sample Experiment/ })).toBeVisible();
  });

  it('marks the experience the developer is already on', () => {
    // Arrange / Act
    renderSwitcher({ currentSlug: 'sample-experiment' });

    // Assert
    expect(screen.getByRole('button', { name: /Sample Experiment/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /Production/ })).not.toHaveAttribute('aria-current', 'true');
  });

  it('reports the chosen experience back to the tools', async () => {
    // Arrange
    const { onSelect, user } = renderSwitcher();

    // Act
    await user.click(screen.getByRole('button', { name: /Sample Experiment/ }));

    // Assert
    expect(onSelect).toHaveBeenCalledWith('sample-experiment');
  });

  it('reports production as a null slug', async () => {
    // Arrange
    const { onSelect, user } = renderSwitcher({ currentSlug: 'sample-experiment' });

    // Act
    await user.click(screen.getByRole('button', { name: /Production/ }));

    // Assert
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('dismisses on Escape and on the close control', async () => {
    // Arrange
    const { onClose, user } = renderSwitcher();

    // Act
    await user.keyboard('{Escape}');

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);

    // Act
    await user.click(screen.getByRole('button', { name: 'Close experience picker' }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('moves focus into the picker when it opens', () => {
    // Arrange / Act
    renderSwitcher();

    // Assert
    expect(screen.getByRole('button', { name: /Production/ })).toHaveFocus();
  });
});
