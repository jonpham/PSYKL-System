import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsView } from '../SettingsView';

vi.mock('../../../ExperimentsIndex', () => ({
  ExperimentsIndex: () => <p>experiments</p>,
}));

vi.mock('../../../../components/AppVersion', () => ({
  AppVersion: () => <p>version</p>,
}));

describe('SettingsView (Unit)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('offers appearance above the experiments section', () => {
    // Arrange / Act
    render(<SettingsView onThemeChange={() => undefined} theme="system" />);

    // Assert
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings.indexOf('Appearance')).toBeLessThan(headings.indexOf('Experiments'));
  });

  it('reports the chosen appearance and marks it as current', async () => {
    // Arrange
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    render(<SettingsView onThemeChange={onThemeChange} theme="system" />);

    // Act
    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    // Assert
    expect(onThemeChange).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });
});
