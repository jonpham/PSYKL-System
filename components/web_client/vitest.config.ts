import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.unit.test.tsx', 'src/**/*.component.test.tsx'],
    testTimeout: 10_000,
  },
});
