import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { navigate, usePathname } from '../usePathname';

describe('usePathname', () => {
  it('reports the current pathname', () => {
    // Arrange / Act
    const { result } = renderHook(() => usePathname());

    // Assert
    expect(result.current).toBe(window.location.pathname);
  });

  it('re-renders when navigate() pushes a new path', () => {
    // Arrange
    const { result } = renderHook(() => usePathname());

    // Act
    act(() => navigate('/exp/task-sections'));

    // Assert
    expect(result.current).toBe('/exp/task-sections');
  });

  it('re-renders on browser back/forward', () => {
    // Arrange
    const { result } = renderHook(() => usePathname());
    act(() => navigate('/exp'));

    // Act
    act(() => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Assert
    expect(result.current).toBe('/');
  });
});
