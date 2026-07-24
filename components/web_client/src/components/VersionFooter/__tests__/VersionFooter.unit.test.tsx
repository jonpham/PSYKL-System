import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/setup';
import { VersionFooter } from '../VersionFooter';

const versionResponse = (commit: string) =>
  http.get('*/version', () => HttpResponse.json({ component: 'service-task', commit }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('VersionFooter (Unit)', () => {
  it('renders the web client build commit (short) from VITE_GIT_SHA', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', 'abcdef1234567');
    server.use(versionResponse('abcdef1234567'));

    // Act
    render(<VersionFooter />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/in sync/i));
    expect(screen.getByLabelText(/web client commit/i)).toHaveTextContent('abcdef1');
  });

  it('reports "in sync" when the web and api commits match', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', 'abcdef1234567');
    server.use(versionResponse('abcdef1234567'));

    // Act
    render(<VersionFooter />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/in sync/i));
    expect(screen.getByLabelText(/api commit/i)).toHaveTextContent('abcdef1');
  });

  it('reports a mismatch when the web and api commits differ', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', 'abcdef1234567');
    server.use(versionResponse('9999999aaaaaa'));

    // Act
    render(<VersionFooter />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/mismatch/i));
    expect(screen.getByLabelText(/api commit/i)).toHaveTextContent('9999999');
  });

  it('degrades gracefully when the api version request fails', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', 'abcdef1234567');
    server.use(http.get('*/version', () => new HttpResponse(null, { status: 500 })));

    // Act
    render(<VersionFooter />);

    // Assert — web commit still shows; api reported unavailable; no crash
    await waitFor(() => expect(screen.getByLabelText(/api commit/i)).toHaveTextContent(/unavailable/i));
    expect(screen.getByLabelText(/web client commit/i)).toHaveTextContent('abcdef1');
  });

  it('shows "dev" for the web commit when VITE_GIT_SHA is unset', async () => {
    // Arrange
    vi.stubEnv('VITE_GIT_SHA', '');
    server.use(versionResponse('dev'));

    // Act
    render(<VersionFooter />);

    // Assert
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/in sync/i));
    expect(screen.getByLabelText(/web client commit/i)).toHaveTextContent('dev');
  });
});
