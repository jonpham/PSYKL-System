import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';

import { handlers, resetStore } from '../src/test/msw-handlers';

// Initialize MSW for the Storybook browser runtime. The service worker is
// served from `public/mockServiceWorker.js` (see staticDirs in main.ts).
initialize({
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    url: './mockServiceWorker.js',
  },
});

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
      return {};
    },
    mswLoader,
  ],
};

export default preview;
