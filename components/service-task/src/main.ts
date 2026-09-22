import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { UserIdGuard } from './auth/user-id.guard.js';
import { corsOptions } from './http/cors.options.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions());
  app.useGlobalGuards(new UserIdGuard());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`service-task listening on http://0.0.0.0:${port}`);
}

void bootstrap();
