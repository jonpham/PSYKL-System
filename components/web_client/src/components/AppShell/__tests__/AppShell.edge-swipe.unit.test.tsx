import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from '../AppShell';

vi.mock('../../../hooks/useLists', () => ({
  useLists: () => ({ createList: vi.fn(), lists: [], loading: false, renameList: vi.fn() }),
}));
vi.mock('../../../hooks/useActiveList', () => ({
  setActiveListId: vi.fn(),
  useActiveListId: () => null,
}));

const SIDEBAR_WIDTH = 300;
const SAMPLE_INTERVAL_MS = 100;
let clock = 0;

beforeEach(() => {
  clock = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  // jsdom measures everything as zero, which would put every settle threshold
  // at zero; the sidebar is the only width this suite reads.
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains('psykl-app-shell__sidebar') ? SIDEBAR_WIDTH : 0;
    },
  });
  // The narrow layout is the one with an edge gesture; the trigger is hidden
  // past 768px, which is how the shell knows which layout it is in.
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      return this.ownerDocument.body;
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pointer(type: string, target: EventTarget, x = 0, y = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  });
}

function drag(from: EventTarget, xs: number[]): void {
  const [start, ...rest] = xs;
  pointer('pointerdown', from, start, 300);
  for (const x of rest) {
    clock += SAMPLE_INTERVAL_MS;
    pointer('pointermove', window, x, 300);
  }
  pointer('pointerup', window);
}

function sidebar(): HTMLElement {
  const aside = document.querySelector('.psykl-app-shell__sidebar');
  if (!aside) throw new Error('the shell has no sidebar');
  return aside as HTMLElement;
}

function shell(): HTMLElement {
  const layout = document.querySelector('.psykl-app-shell__layout');
  if (!layout) throw new Error('the shell has no layout');
  return layout as HTMLElement;
}

describe('AppShell edge swipe (Unit)', () => {
  it('opens the sidebar when the drag starts at the left edge and crosses the threshold', () => {
    // Arrange
    render(<AppShell title="My Tasks">list</AppShell>);

    // Act — in from the gutter, past 40% of the sidebar
    drag(shell(), [8, 80, 160]);

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'true');
  });

  it('ignores a drag that starts away from the edge, so the list keeps its own gestures', () => {
    // Arrange
    render(<AppShell title="My Tasks">list</AppShell>);

    // Act
    drag(shell(), [200, 280, 360]);

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });

  it('settles shut again when the drag stops short of the threshold', () => {
    // Arrange
    render(<AppShell title="My Tasks">list</AppShell>);

    // Act
    drag(shell(), [8, 30, 60]);

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });

  it('closes an open sidebar when it is dragged back to the left', () => {
    // Arrange
    render(<AppShell title="My Tasks">list</AppShell>);
    drag(shell(), [8, 80, 160]);
    expect(sidebar()).toHaveAttribute('data-open', 'true');

    // Act
    drag(sidebar(), [280, 180, 80]);

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });

  it('leaves the header button and the backdrop working, so no tap depends on a gesture', async () => {
    // Arrange
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<AppShell title="My Tasks">list</AppShell>);

    // Act
    await user.click(screen.getByRole('button', { name: /open psykl navigation/i }));

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'true');

    // Act
    await user.click(screen.getByRole('button', { name: /dismiss psykl navigation/i }));

    // Assert
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });
});
