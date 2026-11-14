import type { INestApplication } from '@nestjs/common';

import { UserIdGuard } from './auth/user-id.guard.js';
import type { Db } from './db/index.js';
import { corsOptions } from './http/cors.options.js';
import { seedDefaultList } from './list/default-list.seed.js';
import { DB_TOKEN } from './task/task.service.js';

/**
 * Everything the running service sets up before it listens. It lives outside
 * main.ts so a contract test can run the same start-up.
 */
async function prepareApp(app: INestApplication): Promise<void> {
  app.enableCors(corsOptions());
  app.useGlobalGuards(new UserIdGuard());
  await seedDefaultList(app.get<Db>(DB_TOKEN));
}

export { prepareApp };
