import '../../../../styles/tokens.css';

import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/test';

import { DestinationGlyph, HeaderGlyph, PlusGlyph } from '../Glyphs';

function GlyphFixture() {
  return (
    <div>
      <HeaderGlyph name="menu" />
      <PlusGlyph />
      <DestinationGlyph name="lists" />
    </div>
  );
}

const meta: Meta<typeof GlyphFixture> = {
  title: 'PSYKL/AppShell/Glyphs',
  component: GlyphFixture,
};

export default meta;

type Story = StoryObj<typeof GlyphFixture>;

export const RenderedGlyphs: Story = {
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('.psykl-header-glyph');
    const plus = canvasElement.querySelector('.psykl-plus-glyph');

    expect(header).not.toBeNull();
    expect(plus).not.toBeNull();
    expect(getComputedStyle(header as Element).stroke).not.toBe('none');
    expect(getComputedStyle(header as Element).width).toBe('24px');
    expect(getComputedStyle(plus as Element).stroke).not.toBe('none');
    expect(getComputedStyle(plus as Element).width).toBe('20px');
  },
};

export const IncreasedContrast: Story = {
  play: async () => {
    const root = document.documentElement;

    try {
      root.dataset.theme = 'light';
      root.dataset.contrast = 'increased';
      expect(token('--text-secondary')).toBe('#6d6d72');
      expect(token('--text-tertiary')).toBe('#8e8e93');
      expect(token('--accent')).toBe('#0069e0');

      root.dataset.theme = 'dark';
      expect(token('--text-secondary')).toBe('#98989f');
      expect(token('--text-tertiary')).toBe('#6e6e73');
      expect(token('--accent')).toBe('#0a84ff');
    } finally {
      delete root.dataset.theme;
      delete root.dataset.contrast;
    }
  },
};

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
