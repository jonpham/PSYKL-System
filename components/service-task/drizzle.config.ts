import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema/task.ts', './src/db/schema/idempotency.ts'],
  out: './drizzle/migrations',
});
