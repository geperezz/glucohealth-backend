import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from './app.module';
import { version } from '../package.json';
import { Config } from './config/config.loader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: Config = app.get('CONFIG');

  app.enableCors({
    origin: config.FRONTEND_URL,
  });
  addSwaggerSupport(app);

  await app.listen(config.APP_PORT);
}
bootstrap();

function addSwaggerSupport(app: INestApplication): void {
  patchNestJsSwagger();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GlucoHealth')
    .setDescription('The GlucoHealth API documentation')
    .setVersion(version)
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, openApiDocument);
}
