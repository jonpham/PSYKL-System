import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const sheet = readFileSync('src/styles/tokens.css', 'utf8');

/** The `:root { … }` block, excluding every nested media block. */
function rootBlock(css: string): string {
  const start = css.indexOf(':root {');
  const end = css.indexOf('\n}', start);
  return css.slice(start, end);
}

describe('tokens.css', () => {
  it('defines every semantic token the contract requires', () => {
    // Given the semantic token contract
    const required = [
      '--bg-app',
      '--bg-grouped',
      '--bg-elevated',
      '--bg-pressed',
      '--bg-selected',
      '--text-primary',
      '--text-secondary',
      '--text-tertiary',
      '--text-on-accent',
      '--separator',
      '--accent',
      '--accent-session',
      '--status-warn',
      '--status-good',
      '--destructive',
      '--focus-ring',
      '--font-ui',
      '--font-numeric',
      '--radius-control',
      '--radius-field',
      '--icon-tile',
      '--icon-glyph',
      '--gutter',
      '--row-min',
      '--content-max',
    ];

    // When / Then — each is defined in the bare :root block, not only in a media block
    const root = rootBlock(sheet);
    for (const token of required) {
      expect(root, `${token} must be defined at :root`).toContain(`${token}:`);
    }
  });

  it('defines no token inside the reduced-motion block', () => {
    // Given the reduced-motion block
    const start = sheet.indexOf('@media (prefers-reduced-motion: reduce)');
    const block = start === -1 ? '' : sheet.slice(start);

    // When / Then — it carries motion rules only
    expect(block).not.toMatch(/^\s*--[a-z-]+:/m);
  });

  it('raises exactly the four tokens Increased Contrast is allowed to touch', () => {
    // Given the Increased Contrast override blocks
    const overrides = sheet.match(/\[data-contrast='increased'\][^}]*}/g) ?? [];

    // Then only the three light tokens and the one dark token appear
    const touched = new Set(overrides.flatMap((block) => block.match(/--[a-z-]+(?=:)/g) ?? []));
    expect([...touched].sort()).toEqual(['--accent', '--text-secondary', '--text-tertiary']);
  });
});
