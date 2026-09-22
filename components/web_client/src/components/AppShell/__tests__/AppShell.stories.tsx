import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { AppShell } from '../AppShell';

const meta: Meta<typeof AppShell> = {
  title: 'PSYKL/AppShell',
  component: AppShell,
  args: { children: <p>Destination content</p>, title: 'Tasks' },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

export const Closed: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { defaultViewport: 'mobile2' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Open PSYKL navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(canvasElement.querySelector('nav[aria-label="PSYKL navigation"]')).not.toBeVisible();
  },
};

export const Opened: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { defaultViewport: 'mobile2' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open PSYKL navigation' });
    await userEvent.click(trigger);
    await expect(canvas.getByRole('navigation', { name: 'PSYKL navigation' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
  },
};

export const HeaderGlyphDoesNotShift: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { defaultViewport: 'mobile2' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open PSYKL navigation' });
    const before = trigger.getBoundingClientRect();
    await userEvent.click(trigger);
    const after = canvas.getByRole('button', { name: 'Close PSYKL navigation' }).getBoundingClientRect();
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
  },
};

export const IncreasedContrast: Story = {
  play: async () => {
    const root = document.documentElement;
    try {
      root.dataset.theme = 'light';
      root.dataset.contrast = 'increased';
      expect(getComputedStyle(root).getPropertyValue('--text-secondary').trim()).toBe('#6d6d72');
    } finally {
      delete root.dataset.theme;
      delete root.dataset.contrast;
    }
  },
};

export const Desktop: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 1024 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { viewport: { defaultViewport: 'tablet' } },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('.psykl-app-shell__content')?.getBoundingClientRect().width).toBeLessThanOrEqual(
      680,
    );
  },
};
import '../../../styles/tokens.css';
