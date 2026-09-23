import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/test';

import { BrandMark } from '../BrandMark';

const meta: Meta<typeof BrandMark> = {
  title: 'PSYKL/BrandMark',
  component: BrandMark,
};

export default meta;
type Story = StoryObj<typeof BrandMark>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Assert — decorative: the control or heading around it carries the name.
    const svg = canvasElement.querySelector('svg.psykl-brand-mark');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
    await expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  },
};

export const FollowsTheTextColour: Story = {
  decorators: [
    (Story) => (
      <p style={{ color: 'rgb(255, 0, 0)' }}>
        <Story />
      </p>
    ),
  ],
  play: async ({ canvasElement }) => {
    // Assert — one mark serves every theme and contrast because it inherits.
    const path = canvasElement.querySelector('svg.psykl-brand-mark path');
    await expect(path).not.toBeNull();
    await expect(getComputedStyle(path as Element).fill).toBe('rgb(255, 0, 0)');
  },
};
import '../../../../styles/tokens.css';
