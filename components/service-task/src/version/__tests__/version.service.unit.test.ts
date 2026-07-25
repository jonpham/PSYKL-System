import { afterEach, describe, expect, it } from 'vitest';

import { VersionService } from '../version.service.js';

describe('VersionService', () => {
  const originalGitSha = process.env.GIT_SHA;

  afterEach(() => {
    if (originalGitSha === undefined) {
      delete process.env.GIT_SHA;
    } else {
      process.env.GIT_SHA = originalGitSha;
    }
  });

  it('reports the baked GIT_SHA build commit', () => {
    // Given
    process.env.GIT_SHA = 'abc1234';
    const service = new VersionService();

    // When
    const info = service.getVersion();

    // Then
    expect(info).toEqual({ component: 'service-task', commit: 'abc1234' });
  });

  it('trims surrounding whitespace from GIT_SHA', () => {
    // Given
    process.env.GIT_SHA = '  def5678  ';
    const service = new VersionService();

    // When
    const info = service.getVersion();

    // Then
    expect(info.commit).toBe('def5678');
  });

  it('falls back to "dev" when GIT_SHA is unset or empty', () => {
    // Given
    delete process.env.GIT_SHA;
    const service = new VersionService();

    // When
    const info = service.getVersion();

    // Then
    expect(info).toEqual({ component: 'service-task', commit: 'dev' });
  });
});
