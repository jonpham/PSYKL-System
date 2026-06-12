import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // UI Component-layer tests live in `*.stories.tsx` play functions
    // (per M1 DESIGN.md Decision #33 / #34 re-open). Vitest matches Unit and
    // Integration tests; `pnpm test:component` is wired to Storybook's
    // `@storybook/test-runner` CLI instead.
    include: ['src/**/*.unit.test.{ts,tsx}', 'tests/integration/**/*.integration.test.{ts,tsx}'],
    testTimeout: 10_000,
  },
});
