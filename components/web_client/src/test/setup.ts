import '@testing-library/jest-dom/vitest';

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { handlers, resetStore } from './msw-handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetStore());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
