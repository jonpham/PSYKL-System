import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { readAppearance, readContrast } from '../../../preferences';
import { SettingsView } from '../SettingsView';

afterEach(async () => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-contrast');
  await deleteDB('psykl');
});

describe('SettingsView (Unit)', () => {
  it('stamps the chosen appearance on the document', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SettingsView />);

    // Act
    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    // Assert
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await waitFor(async () => expect(await readAppearance()).toBe('dark'));
  });

  it('stamps nothing for System, so the device decides', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SettingsView />);
    await user.click(screen.getByRole('radio', { name: 'Light' }));

    // Act
    await user.click(screen.getByRole('radio', { name: 'System' }));

    // Assert
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('composes contrast with the appearance rather than replacing it', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SettingsView />);

    // Act
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'Increased' }));

    // Assert — both attributes stand together
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-contrast', 'increased');
    await waitFor(async () => expect(await readContrast()).toBe('increased'));
  });

  it('takes increased contrast back off', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SettingsView />);
    await user.click(screen.getByRole('radio', { name: 'Increased' }));

    // Act
    await user.click(screen.getByRole('radio', { name: 'Standard' }));

    // Assert
    expect(document.documentElement).not.toHaveAttribute('data-contrast');
  });
});
