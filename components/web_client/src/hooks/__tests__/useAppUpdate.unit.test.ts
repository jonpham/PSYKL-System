import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../test/setup';
import { useAppUpdate } from '../useAppUpdate';

const manifest = (commit: string) => http.get('*/version.json', () => HttpResponse.json({ commit }));

/** A stand-in for `navigator.serviceWorker` with a controllable waiting worker. */
function fakeContainer(options: { waiting?: { postMessage: (message: unknown) => void } } = {}) {
  const listeners = new Set<() => void>();
  const registration = {
    update: vi.fn(async () => undefined),
    waiting: options.waiting ?? null,
  };
  return {
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'controllerchange') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'controllerchange') listeners.delete(listener);
    },
    getRegistration: vi.fn(async () => registration),
    registration,
    /** Simulate the browser activating the new worker. */
    emitControllerChange: () => listeners.forEach((listener) => listener()),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useAppUpdate (Unit)', () => {
  it('reports up to date when the deployed commit matches the loaded one', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(manifest('3f9a1c2bbbb'));

    // Act
    const { result } = renderHook(() => useAppUpdate({ container: fakeContainer() as never }));

    // Assert
    await waitFor(() => expect(result.current.status).toBe('up-to-date'));
    expect(result.current.currentCommit).toBe('3f9a1c2bbbb');
    expect(result.current.availableCommit).toBe('3f9a1c2bbbb');
  });

  it('reports an available update when the deployed commit differs', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(manifest('8b12d44cccc'));

    // Act
    const { result } = renderHook(() => useAppUpdate({ container: fakeContainer() as never }));

    // Assert
    await waitFor(() => expect(result.current.status).toBe('update-available'));
    expect(result.current.availableCommit).toBe('8b12d44cccc');
  });

  it('asks the browser to re-check the worker script while checking', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', 'dev');
    server.use(manifest('dev'));
    const container = fakeContainer();

    // Act
    const { result } = renderHook(() => useAppUpdate({ container: container as never }));

    // Assert
    await waitFor(() => expect(result.current.status).toBe('up-to-date'));
    expect(container.registration.update).toHaveBeenCalled();
  });

  it('reports failure when the version manifest cannot be read', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(http.get('*/version.json', () => HttpResponse.error()));

    // Act
    const { result } = renderHook(() => useAppUpdate({ container: fakeContainer() as never }));

    // Assert
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.availableCommit).toBeNull();
  });

  it('recovers when a later check succeeds', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(http.get('*/version.json', () => HttpResponse.error()));
    const { result } = renderHook(() => useAppUpdate({ container: fakeContainer() as never }));
    await waitFor(() => expect(result.current.status).toBe('failed'));
    server.use(manifest('8b12d44cccc'));

    // Act
    act(() => result.current.recheck());

    // Assert
    await waitFor(() => expect(result.current.status).toBe('update-available'));
  });

  it('activates the waiting worker and reloads once it takes control', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(manifest('8b12d44cccc'));
    const postMessage = vi.fn();
    const container = fakeContainer({ waiting: { postMessage } });
    const reload = vi.fn();
    const { result } = renderHook(() => useAppUpdate({ container: container as never, reload }));
    await waitFor(() => expect(result.current.status).toBe('update-available'));

    // Act
    act(() => result.current.applyUpdate());

    // Assert
    await waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'PSYKL_SKIP_WAITING' }));
    expect(result.current.status).toBe('updating');
    expect(reload).not.toHaveBeenCalled();
    act(() => container.emitControllerChange());
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('reloads anyway when the waiting worker never takes control', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(manifest('8b12d44cccc'));
    const container = fakeContainer({ waiting: { postMessage: vi.fn() } });
    const reload = vi.fn();
    const { result } = renderHook(() =>
      useAppUpdate({ container: container as never, handshakeTimeoutMs: 10, reload }),
    );
    await waitFor(() => expect(result.current.status).toBe('update-available'));

    // Act — no controllerchange is ever emitted
    act(() => result.current.applyUpdate());

    // Assert
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('reloads directly when no worker is waiting', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(manifest('8b12d44cccc'));
    const reload = vi.fn();
    const { result } = renderHook(() => useAppUpdate({ container: fakeContainer() as never, reload }));
    await waitFor(() => expect(result.current.status).toBe('update-available'));

    // Act
    act(() => result.current.applyUpdate());

    // Assert
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
