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

  it('re-tints the browser chrome when the system appearance flips under System', async () => {
    // Given — a device that will flip, and a sheet that follows it
    let onFlip: () => void = () => {};
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        addEventListener: (_: string, listener: () => void) => {
          onFlip = listener;
        },
        matches: false,
        removeEventListener: vi.fn(),
      })),
    );
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#fff" />');
    await applyStoredPreferences();

    // When
    document.documentElement.style.setProperty('--bg-app', '#000');
    onFlip();

    // Then
    await vi.waitFor(() => {
      expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#000');
    });
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty('--bg-app');
  });
});
