import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // UI Component-layer tests now live in `*.stories.tsx` play functions
    // (per M1 DESIGN.md Decision #33 / #34 re-open). Vitest only matches Unit
    // tests for web_client; `pnpm test:component` is wired to Storybook's
    // `@storybook/test-runner` CLI instead.
    include: ['src/**/*.unit.test.{ts,tsx}', 'src/**/*.integration.test.{ts,tsx}'],
    testTimeout: 10_000,
  },
});
