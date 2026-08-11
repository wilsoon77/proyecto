import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { SwaggerModule } from '@nestjs/swagger';
import { createSwaggerConfig } from '../src/common/swagger.config.js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();
process.env.SKIP_DB = '1';

const openApiServerUrl =
  process.env.OPENAPI_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://proyecto-dp81.onrender.com';
const openApiLocalServerUrl = process.env.OPENAPI_LOCAL_SERVER_URL || 'http://localhost:4000';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = createSwaggerConfig([
    { url: openApiServerUrl, description: 'Producción' },
    { url: openApiLocalServerUrl, description: 'Local' },
  ]);
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
