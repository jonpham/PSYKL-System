import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyStoredPreferences } from '../bootstrap';

vi.mock('../appearance', async () => ({
  ...(await vi.importActual<typeof import('../appearance')>('../appearance')),
  readAppearance: vi.fn().mockResolvedValue('dark'),
}));

vi.mock('../contrast', async () => ({
  ...(await vi.importActual<typeof import('../contrast')>('../contrast')),
  readContrast: vi.fn().mockResolvedValue('increased'),
}));

describe('applyStoredPreferences', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />';
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-contrast');
  });

  it('applies the saved appearance at startup, without waiting for Settings to be opened', async () => {
    // When
    await applyStoredPreferences();

    // Then
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-contrast', 'increased');
    expect(document.querySelector('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      '/apple-touch-icon-dark.png',
    );
  });
});
