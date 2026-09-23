import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyPreferences, resolveIconTheme } from '../apply';

function setSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function iconHref() {
  return document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');
}

describe('resolveIconTheme', () => {
  it('follows an explicit appearance choice whatever the system is set to', () => {
    // Given
    setSystemDark(true);

    // When / Then
    expect(resolveIconTheme('light')).toBe('light');
    expect(resolveIconTheme('dark')).toBe('dark');
  });

  it('defers to the system appearance when the choice is System', () => {
    // Given
    setSystemDark(true);

    // When / Then
    expect(resolveIconTheme('system')).toBe('dark');

    // Given
    setSystemDark(false);

    // When / Then
    expect(resolveIconTheme('system')).toBe('light');
  });
});

describe('applyPreferences', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />';
    setSystemDark(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-contrast');
  });

  it('points the home-screen icon at the dark tile when the app is set to Dark', () => {
    // When
    applyPreferences('dark', 'standard');

    // Then — Add to Home Screen reads this link from the live document
    expect(iconHref()).toBe('/apple-touch-icon-dark.png');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('points it back at the light tile when the app is set to Light under a dark system', () => {
    // Given
    setSystemDark(true);

    // When
    applyPreferences('light', 'standard');

    // Then
    expect(iconHref()).toBe('/apple-touch-icon.png');
  });

  it('takes the system appearance for the icon when the choice is System', () => {
    // Given
    setSystemDark(true);

    // When
    applyPreferences('system', 'standard');

    // Then
    expect(iconHref()).toBe('/apple-touch-icon-dark.png');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });
});
