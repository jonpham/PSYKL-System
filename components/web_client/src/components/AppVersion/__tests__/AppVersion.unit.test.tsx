import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/setup';
import { AppVersion } from '../AppVersion';

const apiVersion = (commit: string) =>
  http.get('*/version', () => HttpResponse.json({ component: 'service-task', commit }));
const webManifest = (commit: string) => http.get('*/version.json', () => HttpResponse.json({ commit }));

/** A service-worker container with nothing waiting — the common browser case. */
const noWaitingWorker = {
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  getRegistration: async () => ({ update: async () => undefined, waiting: null }),
} as never;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('AppVersion (Unit)', () => {
  it('reports "Up to date" when the loaded and deployed commits match', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('3f9a1c2bbbb'));

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/up to date/i));
    expect(screen.getByLabelText(/current web version/i)).toHaveTextContent('3f9a1c2');
    expect(screen.getByLabelText(/available web version/i)).toHaveTextContent('3f9a1c2');
    expect(screen.queryByRole('button', { name: /update to latest version/i })).not.toBeInTheDocument();
  });

  it('offers the update button when a newer version is deployed', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('8b12d44cccc'), apiVersion('8b12d44cccc'));

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByRole('button', { name: /update to latest version/i })).toBeEnabled());
    expect(screen.getByLabelText(/current web version/i)).toHaveTextContent('3f9a1c2');
    expect(screen.getByLabelText(/available web version/i)).toHaveTextContent('8b12d44');
    expect(screen.getByRole('status')).toHaveTextContent(/new version is available/i);
  });

  it('shows an updating state and reloads when the update button is pressed', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('8b12d44cccc'), apiVersion('8b12d44cccc'));
    const reload = vi.fn();
    render(<AppVersion updateOptions={{ container: noWaitingWorker, reload }} />);
    const button = await screen.findByRole('button', { name: /update to latest version/i });

    // Act
    await userEvent.click(button);

    // Assert
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('degrades to a retry when the update check fails', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(
      http.get('*/version.json', () => HttpResponse.error()),
      apiVersion('3f9a1c2bbbb'),
    );

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/couldn't check for updates/i));
    expect(screen.getByLabelText(/available web version/i)).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /update to latest version/i })).not.toBeInTheDocument();
  });

  it('keeps the api build commit as a provenance detail', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('9999999aaaa'));

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByLabelText(/api build/i)).toHaveTextContent('9999999'));
  });

  it('degrades gracefully when the api version request fails', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(
      webManifest('3f9a1c2bbbb'),
      http.get('*/version', () => new HttpResponse(null, { status: 500 })),
    );

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByLabelText(/api build/i)).toHaveTextContent(/unavailable/i));
    expect(screen.getByLabelText(/current web version/i)).toHaveTextContent('3f9a1c2');
  });
});
