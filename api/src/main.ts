import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpErrorFilter } from './common/filters/http-exception.filter.js';
import helmet from 'helmet';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet: Encabezados de seguridad HTTP
  app.use(helmet());

  // CORS: Estricto con orígenes definidos, abierto solo en desarrollo
  const origins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
  } else {
    // Solo permitir CORS abierto en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  CORS abierto (solo desarrollo). Define CORS_ORIGINS para producción.');
      app.enableCors();
    } else {
      console.error('❌ CORS_ORIGINS no definido en producción. API bloqueará peticiones cross-origin.');
    }
  }

  // Validación global: whitelist + forbidNonWhitelisted
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  app.useGlobalFilters(new HttpErrorFilter());

  const port = process.env.PORT || 4000;
  
  // Swagger: Activo en desarrollo y TEMPORALMENTE en producción para pruebas
  // ⚠️ IMPORTANTE: Deshabilitar en producción después de verificar (SWAGGER_ENABLED=false)
  const isProduction = process.env.NODE_ENV === 'production';
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true' || (!isProduction && process.env.SWAGGER_ENABLED !== 'false');
  
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('PanaderIA API')
      .setDescription('API para gestión de productos, inventario y pedidos de la panadería')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth')
      .addTag('products')
      .addTag('categories')
      .addTag('branches')
      .addTag('users')
      .addTag('addresses')
      .addTag('inventory')
      .addTag('stock-movements')
      .addTag('orders')
      .addTag('dashboard')
      .addTag('health')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log('📘 Swagger docs: /docs');
    if (isProduction) {
      console.warn('⚠️  Swagger ACTIVO en PRODUCCIÓN (temporal para pruebas). Deshabilita con SWAGGER_ENABLED=false después de verificar.');
    }
  } else {
    console.log('📘 Swagger deshabilitado');
  }
  
  await app.listen(port);
  console.log(`✅ API running on http://localhost:${port}`);
}

bootstrap();
