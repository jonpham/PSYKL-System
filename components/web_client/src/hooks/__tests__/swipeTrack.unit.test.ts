import { describe, expect, it } from 'vitest';

import { claimsHorizontal, settleVerdict } from '../swipeTrack';

describe('claimsHorizontal (Unit)', () => {
  it('claims nothing until the finger has moved past the threshold', () => {
    // Arrange / Act / Assert — a tap and a jitter are not gestures.
    expect(claimsHorizontal(0, 0, 10)).toBe(false);
    expect(claimsHorizontal(9, 0, 10)).toBe(false);
  });

  it('claims the axis for a mostly-horizontal drag', () => {
    expect(claimsHorizontal(12, 4, 10)).toBe(true);
    expect(claimsHorizontal(-12, 4, 10)).toBe(true);
  });

  it('leaves a mostly-vertical drag to the scroller', () => {
    expect(claimsHorizontal(4, 12, 10)).toBe(false);
    expect(claimsHorizontal(12, 12, 10)).toBe(false);
  });
});

describe('settleVerdict (Unit)', () => {
  it('settles closed when the travel never reached the opening threshold', () => {
    expect(settleVerdict({ openAt: 100, travel: 60, velocity: 0 })).toBe('closed');
  });

  it('settles open once the travel passed the opening threshold', () => {
    expect(settleVerdict({ openAt: 100, travel: 140, velocity: 0 })).toBe('open');
  });

  it('commits when the travel passed the commit threshold', () => {
    expect(settleVerdict({ commitAt: 230, openAt: 100, travel: 260, velocity: 0 })).toBe('commit');
  });

  it('never commits when the surface has no commit threshold', () => {
    expect(settleVerdict({ openAt: 100, travel: 900, velocity: 0 })).toBe('open');
  });

  it('honours a flick that is faster than the threshold, in either direction', () => {
    // Given a travel that would settle closed on distance alone
    expect(settleVerdict({ openAt: 100, travel: 40, velocity: 0.9 })).toBe('open');
    // Given a travel that would settle open on distance alone
    expect(settleVerdict({ openAt: 100, travel: 160, velocity: -0.9 })).toBe('closed');
  });

  it('lets a full-length flick commit rather than merely open', () => {
    expect(settleVerdict({ commitAt: 230, openAt: 100, travel: 300, velocity: 2 })).toBe('commit');
  });

  it('treats a slow drag as distance only, whatever the sign of its last sample', () => {
    expect(settleVerdict({ openAt: 100, travel: 160, velocity: -0.1 })).toBe('open');
  });
});
