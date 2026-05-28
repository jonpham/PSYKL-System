import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/shared-types/vitest.config.ts',
  './components/service-task/vitest.config.ts',
  './components/web_client/vitest.config.ts',
]);
