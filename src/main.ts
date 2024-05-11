import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import 'dotenv/config';

import { AppModule } from './app.module';
import { version } from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL,
  });
  addSwaggerSupport(app);
  await app.listen(process.env.APP_PORT || 3000);
}

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

bootstrap();
