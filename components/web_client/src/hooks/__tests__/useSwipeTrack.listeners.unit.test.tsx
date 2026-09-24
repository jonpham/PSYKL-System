import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSwipeTrack } from '../useSwipeTrack';

function Harness({ onTap }: { onTap?: () => void }) {
  const { onPointerDown } = useSwipeTrack({ onRelease: () => {} });

  return (
    <div data-testid="surface" onPointerDown={onPointerDown}>
      <button onClick={onTap} type="button">
        title
      </button>
    </div>
  );
}

/** See `useSwipeTrack.unit.test.tsx`: jsdom cannot construct a PointerEvent
 * that carries coordinates, so a MouseEvent stands in under its name. */
function pointer(type: string, target: EventTarget, x = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 0 }));
  });
}

function pointerMoveListeners(spy: ReturnType<typeof vi.spyOn>): number {
  return spy.mock.calls.filter(([type]) => type === 'pointermove').length;
}

describe('useSwipeTrack window listeners (Unit)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listens to the window only while a gesture is under way', () => {
    // Arrange — a list renders one of these per row, so an idle row must cost
    // the window nothing
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    render(<Harness />);
    expect(pointerMoveListeners(added)).toBe(0);

    // Act
    pointer('pointerdown', screen.getByTestId('surface'), 200);

    // Assert
    expect(pointerMoveListeners(added)).toBe(1);

    // Act
    pointer('pointerup', window);

    // Assert
    expect(pointerMoveListeners(removed)).toBe(1);
  });

  it('lets go of the window if the row unmounts mid-gesture', () => {
    // Arrange
    const removed = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Harness />);
    pointer('pointerdown', screen.getByTestId('surface'), 200);

    // Act
    unmount();

    // Assert
    expect(pointerMoveListeners(removed)).toBe(1);
  });

  it('swallows the click a mouse sends at the end of a swipe', () => {
    // Arrange — the pointer went down on a control that the surface carried
    // along with it, so the browser's closing click would land on it
    const onTap = vi.fn();
    render(<Harness onTap={onTap} />);
    const title = screen.getByRole('button', { name: 'title' });

    // Act
    pointer('pointerdown', title, 200);
    pointer('pointermove', window, 150);
    pointer('pointerup', window);
    act(() => title.click());

    // Assert
    expect(onTap).not.toHaveBeenCalled();
  });

  it('leaves the click of a plain tap alone', () => {
    // Arrange
    const onTap = vi.fn();
    render(<Harness onTap={onTap} />);
    const title = screen.getByRole('button', { name: 'title' });

    // Act
    pointer('pointerdown', title, 200);
    pointer('pointerup', window);
    act(() => title.click());

    // Assert
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
