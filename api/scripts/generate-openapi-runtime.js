import 'reflect-metadata';
import { writeFileSync, statSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();
process.env.SKIP_DB = '1';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-dummy-jwt-secret-key-32-chars-long';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'ci-dummy-jwt-secret-key-32-chars-long';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

const openApiServerUrl =
  process.env.OPENAPI_SERVER_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://proyecto-dp81.onrender.com';
const openApiLocalServerUrl = process.env.OPENAPI_LOCAL_SERVER_URL || 'http://localhost:4000';

(async () => {
  console.log('[OPENAPI_GEN] Importando módulos...');
  const { NestFactory } = await import('@nestjs/core');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { AppModule } = await import('../dist/src/app.module.js');

  console.log('[OPENAPI_GEN] Creando aplicación NestJS en modo SKIP_DB...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  
  console.log('[OPENAPI_GEN] Generando documento Swagger...');
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
  
  const stats = statSync('openapi.json');
  console.log(`[OPENAPI_GEN] Archivo openapi.json generado exitosamente (${stats.size} bytes).`);

  try {
    await app.close();
  } catch (closeErr) {
    console.warn('[OPENAPI_GEN] Advertencia al cerrar app:', closeErr?.message || closeErr);
  }
  
  console.log('OpenAPI generado en openapi.json (runtime)');
  process.exit(0);
})().catch(err => {
  console.error('[OPENAPI_GEN_ERROR] Fallo al generar OpenAPI:');
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
