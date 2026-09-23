import { afterEach, describe, expect, it, vi } from 'vitest';

import { EXPERIMENT_TOOLS_KEY, experimentToolsStore } from '../experimentToolsStore';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('experimentToolsStore', () => {
  it('stays off until an experiment is opened', () => {
    // Arrange / Act / Assert
    expect(experimentToolsStore.read()).toBe(false);
  });

  it('remembers that the tools were turned on', () => {
    // Act
    experimentToolsStore.write(true);

    // Assert
    expect(window.localStorage.getItem(EXPERIMENT_TOOLS_KEY)).toBe('on');
    expect(experimentToolsStore.read()).toBe(true);
  });

  it('forgets the tools once they are closed', () => {
    // Arrange
    experimentToolsStore.write(true);

    // Act
    experimentToolsStore.write(false);

    // Assert
    expect(window.localStorage.getItem(EXPERIMENT_TOOLS_KEY)).toBeNull();
    expect(experimentToolsStore.read()).toBe(false);
  });

  it('notifies subscribers when the tools are switched', () => {
    // Arrange
    const listener = vi.fn();
    const unsubscribe = experimentToolsStore.subscribe(listener);

    // Act
    experimentToolsStore.write(true);

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);

    // Act
    unsubscribe();
    experimentToolsStore.write(false);

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reads as off when storage is unavailable', () => {
    // Given a browser that refuses localStorage (private mode, blocked site data)
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    // When / Then
    expect(() => experimentToolsStore.write(true)).not.toThrow();
    expect(experimentToolsStore.read()).toBe(false);
  });
});
