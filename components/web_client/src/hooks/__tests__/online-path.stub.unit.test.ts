import { describe, expect, it } from 'vitest';

import { useListsApiClient } from '../useLists.api';
import { useTasksApiClient } from '../useTasks.api';

describe('online path stubs', () => {
  it('refuses a task capture with a named error instead of dropping it silently', async () => {
    // When / Then
    await expect(useTasksApiClient().createTask('Buy milk')).rejects.toMatchObject({
      message: 'createTask is not available with Offline Mode off yet',
    });
  });

  it('refuses a list rename with a named error', async () => {
    // When / Then
    await expect(useListsApiClient().renameList('any-id', 'Groceries')).rejects.toMatchObject({
      message: 'renameList is not available with Offline Mode off yet',
    });
  });
});
