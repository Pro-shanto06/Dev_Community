import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

dotenv.config();

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT;
  if (!port) {
    logger.error('PORT is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    await app.listen(port);
    logger.log(`Application is running on PORT => ${port}`);
  } catch (error) {
    logger.error(`Failed to start the application ${error.message}`);
  }
}

bootstrap();
