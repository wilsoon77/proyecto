import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../dist/src/app.module.js';
import { writeFileSync } from 'fs';
process.env.SKIP_DB = '1';

(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('PanaderIA API')
    .setDescription('Especificación OpenAPI para la panadería')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('auth')
    .addTag('products')
    .addTag('inventory')
    .addTag('stock-movements')
    .addTag('orders')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi.json', JSON.stringify(doc, null, 2));
  await app.close();
  console.log('OpenAPI generado en openapi.json (runtime)');
})().catch(err => { console.error(err); process.exit(1); });
