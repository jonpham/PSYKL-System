import { describe, expect, it, vi } from 'vitest';

import { registerPsyklSync } from '../sw-registration';

describe('registerPsyklSync', () => {
  it('registers the psykl-sync tag when Background Sync is available', async () => {
    // Arrange
    const register = vi.fn<(tag: string) => Promise<void>>().mockResolvedValue(undefined);
    const logger = { warn: vi.fn() };

    // Act
    await registerPsyklSync({
      logger,
      serviceWorkerReady: Promise.resolve({ sync: { register } }),
    });

    // Assert
    expect(register).toHaveBeenCalledWith('psykl-sync');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('no-ops when Background Sync is unavailable', async () => {
    // Arrange
    const logger = { warn: vi.fn() };

    // Act
    await registerPsyklSync({
      logger,
      serviceWorkerReady: Promise.resolve({}),
    });

    // Assert
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a warning when registration is rejected', async () => {
    // Arrange
    const error = new Error('registration rejected');
    const logger = { warn: vi.fn() };
    const register = vi.fn<(tag: string) => Promise<void>>().mockRejectedValue(error);

    // Act
    await registerPsyklSync({
      logger,
      serviceWorkerReady: Promise.resolve({ sync: { register } }),
    });

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('Background Sync registration failed', error);
  });
});
