import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SwipeRelease } from '../useSwipeTrack';
import { useSwipeTrack } from '../useSwipeTrack';

function Harness({ enabled = true, onRelease }: { enabled?: boolean; onRelease: (release: SwipeRelease) => void }) {
  const { delta, onPointerDown, tracking } = useSwipeTrack({ enabled, onRelease });

  return (
    <div data-delta={delta} data-testid="surface" data-tracking={tracking} onPointerDown={onPointerDown}>
      surface
    </div>
  );
}

/**
 * jsdom has no constructible `PointerEvent`, and Testing Library's `fireEvent`
 * silently drops `clientX` when it falls back to a bare `Event` — which is a
 * gesture with no coordinates. A `MouseEvent` carries them and dispatches
 * under the pointer event's name, which is all React and the hook read.
 */
function pointer(type: string, target: EventTarget, x = 0, y = 0): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  });
}

function press(x: number, y = 0): void {
  pointer('pointerdown', screen.getByTestId('surface'), x, y);
}

function moveTo(x: number, y = 0): void {
  pointer('pointermove', window, x, y);
}

function release(): void {
  pointer('pointerup', window);
}

describe('useSwipeTrack (Unit)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports nothing until the drag has claimed the horizontal axis', () => {
    // Arrange
    render(<Harness onRelease={() => {}} />);

    // Act — a few pixels of jitter
    press(100);
    moveTo(104);

    // Assert
    expect(screen.getByTestId('surface')).toHaveAttribute('data-tracking', 'false');
    expect(screen.getByTestId('surface')).toHaveAttribute('data-delta', '0');
  });

  it('tracks the finger once the drag is horizontal', () => {
    // Arrange
    render(<Harness onRelease={() => {}} />);

    // Act
    press(200);
    moveTo(160);

    // Assert — signed, so the consumer knows which way it went
    expect(screen.getByTestId('surface')).toHaveAttribute('data-tracking', 'true');
    expect(screen.getByTestId('surface')).toHaveAttribute('data-delta', '-40');
  });

  it('hands the scroller a mostly-vertical drag and never wakes again', () => {
    // Arrange
    const onRelease = vi.fn();
    render(<Harness onRelease={onRelease} />);

    // Act — down the list first, then sideways
    press(200, 200);
    moveTo(200, 260);
    moveTo(100, 260);
    release();

    // Assert
    expect(screen.getByTestId('surface')).toHaveAttribute('data-tracking', 'false');
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('reports the travel when the finger lifts, and returns to rest', () => {
    // Arrange
    const onRelease = vi.fn();
    render(<Harness onRelease={onRelease} />);

    // Act
    press(200);
    moveTo(120);
    release();

    // Assert
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease.mock.calls[0]?.[0]).toMatchObject({ delta: -80 });
    expect(screen.getByTestId('surface')).toHaveAttribute('data-tracking', 'false');
    expect(screen.getByTestId('surface')).toHaveAttribute('data-delta', '0');
  });

  it('says nothing on a tap, so a tapped control still behaves as one', () => {
    // Arrange
    const onRelease = vi.fn();
    render(<Harness onRelease={onRelease} />);

    // Act
    press(200);
    release();

    // Assert
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('abandons the gesture when the browser cancels the pointer', () => {
    // Arrange
    const onRelease = vi.fn();
    render(<Harness onRelease={onRelease} />);

    // Act — what a scroll takeover looks like from here
    press(200);
    moveTo(120);
    pointer('pointercancel', window);

    // Assert
    expect(onRelease).not.toHaveBeenCalled();
    expect(screen.getByTestId('surface')).toHaveAttribute('data-delta', '0');
  });

  it('does not start at all while it is disabled', () => {
    // Arrange
    const onRelease = vi.fn();
    render(<Harness enabled={false} onRelease={onRelease} />);

    // Act
    press(200);
    moveTo(120);
    release();

    // Assert
    expect(screen.getByTestId('surface')).toHaveAttribute('data-tracking', 'false');
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('reports a velocity signed the same way as the travel', () => {
    // Arrange — a fake clock, so the gesture has a measurable duration
    const onRelease = vi.fn();
    vi.useFakeTimers();
    render(<Harness onRelease={onRelease} />);

    // Act
    press(100);
    vi.advanceTimersByTime(20);
    moveTo(150);
    vi.advanceTimersByTime(20);
    moveTo(200);
    release();

    // Assert
    const reported = onRelease.mock.calls[0]?.[0] as SwipeRelease;
    expect(reported.delta).toBe(100);
    expect(reported.velocity).toBeGreaterThan(0);
  });
});
