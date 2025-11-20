import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();
process.env.SKIP_DB = '1';

async function run() {
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
  const outPath = 'openapi.json';
  writeFileSync(outPath, JSON.stringify(doc, null, 2), { encoding: 'utf-8' });
  await app.close();
  console.log(`OpenAPI generado en ${outPath}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
