import 'reflect-metadata';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();
process.env.SKIP_DB = '1';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-dummy-jwt-secret-key-32-chars-long';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

const openApiServerUrl =
  process.env.OPENAPI_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://proyecto-dp81.onrender.com';
const openApiLocalServerUrl = process.env.OPENAPI_LOCAL_SERVER_URL || 'http://localhost:4000';

(async () => {
  const { NestFactory } = await import('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('../dist/src/app.module.js');

  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Panaderia Svetlana API')
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
})().catch(err => {
  console.error(err);
  process.exit(1);
});
