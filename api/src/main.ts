import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpErrorFilter } from './common/filters/http-exception.filter.js';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  } else {
    app.enableCors();
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpErrorFilter());

  const port = process.env.PORT || 4000;
  if (process.env.ENABLE_SWAGGER !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('PanaderIA API')
      .setDescription('API para gestión de productos, inventario y pedidos de la panadería')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth')
      .addTag('products')
      .addTag('inventory')
      .addTag('stock-movements')
      .addTag('orders')
      .addTag('health')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log('Swagger docs: /docs (si está habilitado)');
}

bootstrap();
