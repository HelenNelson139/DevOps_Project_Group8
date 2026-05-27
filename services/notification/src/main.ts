import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createMetricsMiddleware } from './monitoring/metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(createMetricsMiddleware());
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Notification service listening on port ${port}`);
}
bootstrap();
