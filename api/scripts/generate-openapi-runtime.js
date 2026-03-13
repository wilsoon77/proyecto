import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../dist/src/app.module.js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();
process.env.SKIP_DB = '1';

const openApiServerUrl =
  process.env.OPENAPI_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://proyecto-dp81.onrender.com';
const openApiLocalServerUrl = process.env.OPENAPI_LOCAL_SERVER_URL || 'http://localhost:4000';

(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('PanaderIA API')
    .setDescription('Especificación OpenAPI para la panadería')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addServer(openApiServerUrl, 'Produccion')
    .addServer(openApiLocalServerUrl, 'Local')
    .addTag('auth')
    .addTag('products')
    .addTag('inventory')
    .addTag('stock-movements')
    .addTag('orders')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  doc.servers = [
    { url: openApiServerUrl, description: 'Produccion' },
    { url: openApiLocalServerUrl, description: 'Local' },
  ];
  writeFileSync('openapi.json', JSON.stringify(doc, null, 2));
  await app.close();
  console.log('OpenAPI generado en openapi.json (runtime)');
})().catch(err => { console.error(err); process.exit(1); });
