import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { claimsHorizontal } from './swipeTrack';

/** How far the finger travels before the gesture is horizontal rather than a
 * tap or the start of a scroll. */
const AXIS_THRESHOLD_PX = 10;

/** Velocity is measured over the tail of the gesture, not the whole of it — a
 * long slow drag that ends in a flick should read as a flick. */
const VELOCITY_WINDOW_MS = 100;

/** Below roughly one frame, the samples are too close together to divide by:
 * two moves a fraction of a millisecond apart would report a speed no hand can
 * produce, and a flick that never happened would decide the gesture. */
const MIN_VELOCITY_WINDOW_MS = 8;

interface SwipeRelease {
  /** Signed pixels travelled along the horizontal axis. */
  delta: number;
  /** Signed px/ms over the tail of the gesture. */
  velocity: number;
}

interface UseSwipeTrackOptions {
  /** False turns the surface back into ordinary content — a wide layout, or a
   * row whose mode has no swipe. */
  enabled?: boolean;
  /** Called once per gesture, and only for gestures that claimed the axis, so
   * a tap on a control inside the surface is never mistaken for a swipe. */
  onRelease: (release: SwipeRelease) => void;
}

interface SwipeTrack {
  /** Signed pixels the surface should currently be offset by; 0 at rest. */
  delta: number;
  /** Attach to whatever the user puts a finger on. */
  onPointerDown: (event: ReactPointerEvent) => void;
  /** True from the moment the axis is claimed until the finger lifts. */
  tracking: boolean;
}

interface Gesture {
  claimed: boolean;
  samples: { t: number; x: number }[];
  startX: number;
  startY: number;
}

/**
 * A horizontal drag, tracked from a pointer down to the release verdict.
 *
 * Pointer events rather than touch events: this is judged on an iPhone but has
 * to stay drivable by a mouse, so the same code serves the phone, a desktop
 * browser, and a Playwright run. Move and up are bound to the window rather
 * than the surface, so a finger that leaves the row mid-drag still steers it
 * and a release anywhere still ends the gesture.
 *
 * The gesture yields to the scroller rather than competing with it: the axis
 * is only claimed for a drag that is more horizontal than vertical, and the
 * surface is expected to carry `touch-action: pan-y` so the browser keeps
 * vertical panning for itself. When the browser does take over it sends
 * `pointercancel`, which abandons the gesture with no verdict at all.
 */
function useSwipeTrack({ enabled = true, onRelease }: UseSwipeTrackOptions): SwipeTrack {
  const [delta, setDelta] = useState(0);
  const [tracking, setTracking] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  // Held in a ref so the window listeners bound at pointer-down always call
  // the current handler without rebinding on every render.
  const releaseRef = useRef(onRelease);
  releaseRef.current = onRelease;
  // Unbinds the window listeners of the gesture in progress. The window is
  // only listened to between a pointer-down and its release: a list renders
  // one of these per row, and an idle row must not run on every pointer move
  // the page sees.
  const unbind = useRef<(() => void) | null>(null);

  const end = useCallback((report: boolean) => {
    const current = gesture.current;
    gesture.current = null;
    unbind.current?.();
    unbind.current = null;
    setDelta(0);
    setTracking(false);
    if (!report || !current?.claimed) {
      return;
    }
    swallowNextClick();
    const samples = current.samples;
    const last = samples[samples.length - 1];
    const first = samples.find((sample) => last !== undefined && last.t - sample.t <= VELOCITY_WINDOW_MS);
    const elapsed = last && first ? last.t - first.t : 0;
    const measurable = elapsed >= MIN_VELOCITY_WINDOW_MS && last !== undefined && first !== undefined;
    releaseRef.current({
      delta: last ? last.x - current.startX : 0,
      velocity: measurable ? (last.x - first.x) / elapsed : 0,
    });
  }, []);

  const onMove = useCallback(
    (event: PointerEvent) => {
      const current = gesture.current;
      if (!current) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;

      if (!current.claimed) {
        if (Math.abs(dy) >= AXIS_THRESHOLD_PX && Math.abs(dy) >= Math.abs(dx)) {
          // The finger is going down the list. Give it up now rather than
          // waiting for a `pointercancel` that a mouse would never send.
          end(false);
          return;
        }
        if (!claimsHorizontal(dx, dy, AXIS_THRESHOLD_PX)) return;
        current.claimed = true;
        setTracking(true);
      }

      current.samples.push({ t: performance.now(), x: event.clientX });
      setDelta(dx);
    },
    [end],
  );

  // A row that unmounts mid-gesture — deleted by another device's sync, say —
  // must not leave its listeners on the window.
  useEffect(() => () => unbind.current?.(), []);

  return {
    delta,
    onPointerDown: (event) => {
      if (!enabled) return;
      unbind.current?.();
      gesture.current = {
        claimed: false,
        samples: [{ t: performance.now(), x: event.clientX }],
        startX: event.clientX,
        startY: event.clientY,
      };
      const onUp = () => end(true);
      const onCancel = () => end(false);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      unbind.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
      };
    },
    tracking,
  };
}

/**
 * Eats the click a mouse sends when it lets go after a swipe. The surface
 * carries whatever the pointer went down on along with it, so that click would
 * otherwise land on the title and open an edit the user never asked for. A
 * finger sends no click after a drag, so on touch this expires unused at the
 * end of the task.
 */
function swallowNextClick(): void {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
}

export { type SwipeRelease, useSwipeTrack };
