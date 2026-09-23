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
  it('shows only the current version and a check button when up to date', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('3f9a1c2bbbb'));

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert — an available version equal to the current one is noise, not news
    await waitFor(() => expect(screen.getByRole('button', { name: /check for updates/i })).toBeEnabled());
    expect(screen.getByLabelText(/current web version/i)).toHaveTextContent('3f9a1c2');
    expect(screen.queryByLabelText(/available web version/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/last checked/i);
  });

  it('has no redundant section heading of its own', async () => {
    // Arrange — the surrounding Settings section already says "About"
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('3f9a1c2bbbb'));

    // Act
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/last checked/i));
    expect(screen.queryByRole('heading', { name: /version/i })).not.toBeInTheDocument();
    expect(screen.getByText(/current version:/i)).toBeInTheDocument();
  });

  it('turns the check button into an update button when a newer version appears', async () => {
    // Arrange — up to date on mount, then a deploy lands
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('3f9a1c2bbbb'));
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);
    const checkButton = await screen.findByRole('button', { name: /check for updates/i });
    server.use(webManifest('8b12d44cccc'));

    // Act — without navigating away from Settings
    await userEvent.click(checkButton);

    // Assert
    await waitFor(() => expect(screen.getByRole('button', { name: /update to latest/i })).toBeEnabled());
    expect(screen.getByLabelText(/available web version/i)).toHaveTextContent('8b12d44');
    expect(screen.getByRole('status')).toHaveTextContent(/new version is available/i);
  });

  it('keeps the check button and stamps the time when the check finds nothing new', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('3f9a1c2bbbb'), apiVersion('3f9a1c2bbbb'));
    render(<AppVersion updateOptions={{ container: noWaitingWorker }} />);
    const checkButton = await screen.findByRole('button', { name: /check for updates/i });

    // Act
    await userEvent.click(checkButton);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/last checked:/i));
    expect(screen.getByRole('button', { name: /check for updates/i })).toBeEnabled();
    expect(screen.queryByLabelText(/available web version/i)).not.toBeInTheDocument();
  });

  it('shows an updating state and reloads when the update button is pressed', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '3f9a1c2bbbb');
    server.use(webManifest('8b12d44cccc'), apiVersion('8b12d44cccc'));
    const reload = vi.fn();
    render(<AppVersion updateOptions={{ container: noWaitingWorker, reload }} />);
    const button = await screen.findByRole('button', { name: /update to latest/i });

    // Act
    await userEvent.click(button);

    // Assert
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it('reports a failed check and still offers to check again', async () => {
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
    expect(screen.getByRole('button', { name: /check for updates/i })).toBeEnabled();
    expect(screen.queryByLabelText(/available web version/i)).not.toBeInTheDocument();
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
