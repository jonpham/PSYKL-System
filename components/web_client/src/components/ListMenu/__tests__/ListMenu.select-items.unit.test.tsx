import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ListMenu } from '../ListMenu';

describe('ListMenu — Select Items (Unit)', () => {
  it('offers Select Items and hands the list view the request', async () => {
    // Arrange
    const onSelectItems = vi.fn();
    render(
      <ListMenu completedCount={0} onSelectItems={onSelectItems} onToggleCompleted={() => {}} showCompleted={false} />,
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'List options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Select Items' }));

    // Assert
    expect(onSelectItems).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides Select Items when the surface cannot enter selection mode', async () => {
    // Arrange
    render(<ListMenu completedCount={0} onToggleCompleted={() => {}} showCompleted={false} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'List options' }));

    // Assert
    expect(screen.queryByRole('menuitem', { name: 'Select Items' })).not.toBeInTheDocument();
  });
});
