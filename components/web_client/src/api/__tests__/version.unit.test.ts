import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../test/setup';
import { fetchAvailableWebVersion } from '../version';

describe('fetchAvailableWebVersion (Unit)', () => {
  it('returns the commit published alongside the deployed bundle', async () => {
    // Arrange
    server.use(http.get('*/version.json', () => HttpResponse.json({ commit: '8b12d44aaaa' })));

    // Act
    const commit = await fetchAvailableWebVersion();

    // Assert
    expect(commit).toBe('8b12d44aaaa');
  });

  it('rejects when the SPA fallback serves index.html instead of the manifest', async () => {
    // Arrange — nginx `try_files` answers a missing /version.json with the app shell.
    server.use(
      http.get(
        '*/version.json',
        () => new HttpResponse('<!doctype html><html></html>', { headers: { 'Content-Type': 'text/html' } }),
      ),
    );

    // Act / Then
    await expect(fetchAvailableWebVersion()).rejects.toMatchObject({ message: expect.stringMatching(/json/i) });
  });

  it('rejects when the manifest is missing a usable commit', async () => {
    // Arrange
    server.use(http.get('*/version.json', () => HttpResponse.json({ commit: '' })));

    // Act / Then
    await expect(fetchAvailableWebVersion()).rejects.toMatchObject({ message: expect.stringMatching(/commit/i) });
  });

  it('rejects when the manifest request fails', async () => {
    // Arrange
    server.use(http.get('*/version.json', () => new HttpResponse(null, { status: 503 })));

    // Act / Then
    await expect(fetchAvailableWebVersion()).rejects.toMatchObject({ message: expect.stringMatching(/503/) });
  });
});
