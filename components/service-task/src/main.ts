import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { prepareApp } from './app.bootstrap.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await prepareApp(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`service-task listening on http://0.0.0.0:${port}`);
}

void bootstrap();
