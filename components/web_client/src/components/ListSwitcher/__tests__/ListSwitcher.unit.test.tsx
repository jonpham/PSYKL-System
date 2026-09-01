import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';

import { resetUseListsForTest } from '../../../hooks/useLists';
import { ListSwitcher } from '../ListSwitcher';

const databaseName = 'psykl';

afterEach(async () => {
  resetUseListsForTest();
  await deleteDB(databaseName);
});

describe('ListSwitcher', () => {
  it('shows a default list named Tasks on first run', async () => {
    // Arrange / Act
    render(<ListSwitcher onSelect={() => undefined} open />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'Tasks' })).toBeVisible();
    });
  });

  it('does not offer to delete the only remaining list', async () => {
    // Arrange / Act
    render(<ListSwitcher onSelect={() => undefined} open />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('listitem', { name: 'Tasks' })).toBeVisible();
    });
    expect(screen.queryByRole('button', { name: 'Delete Tasks' })).toBeNull();
  });
});
