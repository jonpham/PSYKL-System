import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.unit.test.ts', 'src/**/*.contract.test.ts', 'tests/integration/**/*.integration.test.ts'],
    testTimeout: 30_000,
  },
});
