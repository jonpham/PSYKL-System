import { describe, expect, it } from 'vitest';

import { notImplementedOnline } from '../online-path.stub';

describe('notImplementedOnline', () => {
  it('refuses a write with a named error instead of dropping it silently', async () => {
    // When / Then
    await expect(notImplementedOnline('restore')).rejects.toMatchObject({
      message: 'restore is not available with Offline Mode off yet',
    });
  });
});
