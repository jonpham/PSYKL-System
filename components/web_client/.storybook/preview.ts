import type { Preview } from '@storybook/react';
import { configure } from '@storybook/test';
import { initialize, mswLoader } from 'msw-storybook-addon';

import { openPsyklDb } from '../src/db/idb';
import { resetUseListsForTest } from '../src/hooks/useLists';
import { resetUseTasksForTest } from '../src/hooks/useTasks';
import { handlers, resetStore } from '../src/test/msw-handlers';

// Initialize MSW for the Storybook browser runtime. The service worker is
// served from `public/mockServiceWorker.js` (see staticDirs in main.ts).
initialize({
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    url: './mockServiceWorker.js',
  },
});

// Global default for every waitFor()/findBy*() call across every story
// (this runs inside the browser/iframe bundle, the same realm play()
// functions execute in via page.evaluate — a Jest-side config wouldn't
// reach it). The testing-library default (1000ms) proved too tight under
// CI's slower/more contended runner across multiple unrelated stories
// (TaskList.stories.tsx, TaskList.mutations.stories.tsx,
// RecentlyDeleted.stories.tsx all hit it independently) even though every
// mutation resolves comfortably fast locally — raising it once here beats
// patching an explicit timeout into every individual assertion.
configure({ asyncUtilTimeout: 5000 });

/**
 * Empties every object store rather than deleting the database.
 *
 * `deleteDB` is blocked for as long as any other connection is open, and a
 * background replay from the story before can still be holding one — the
 * delete then never lands, the next story inherits that story's rows, and a
 * story that asserts on empty local state (AppLoadError) fails. Clearing
 * through a connection of our own cannot be blocked.
 */
async function clearLocalDatabase(): Promise<void> {
  const database = await openPsyklDb();
  try {
    await Promise.all([...database.objectStoreNames].map((store) => database.clear(store)));
  } finally {
    database.close();
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Default handler set; individual stories can override via parameters.msw.
    msw: {
      handlers,
    },
  },
  loaders: [
    async () => {
      // Each story starts with a clean in-memory task store so play functions
      // are deterministic, mirroring the Vitest `beforeEach(resetStore)` setup.
      resetStore();
      resetUseTasksForTest();
      resetUseListsForTest();
      await clearLocalDatabase();
      return {};
    },
    mswLoader,
  ],
};

export default preview;
