import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { HttpErrorFilter } from './common/filters/http-exception.filter.js';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter.js';
import { createSwaggerConfig } from './common/swagger.config.js';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';

// DSN de Sentry para el backend
const sentryDsn = process.env.SENTRY_DSN;

// Inicializar Sentry lo más temprano posible
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy: permite leer la IP real del cliente desde X-Forwarded-For
  // (necesario detrás de proxies como Render, Vercel, Nginx)
  const expressApp = app.getHttpAdapter().getInstance();
  const configuredProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '', 10);
  const trustProxyHops = Number.isInteger(configuredProxyHops) && configuredProxyHops > 0
    ? configuredProxyHops
    : process.env.NODE_ENV === 'production' ? 1 : 0;
  if (trustProxyHops > 0) {
    expressApp.set('trust proxy', trustProxyHops);
  }

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
  
  // Filtros de excepciones: primero Sentry (si está configurado), luego HTTP
  const { httpAdapter } = app.get(HttpAdapterHost);
  if (sentryDsn) {
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
  }
  app.useGlobalFilters(new HttpErrorFilter());

  const port = process.env.PORT || 4000;
  
  // Swagger: Activo en desarrollo y TEMPORALMENTE en producción para pruebas
  // ⚠️ IMPORTANTE: Deshabilitar en producción después de verificar (SWAGGER_ENABLED=false)
  const isProduction = process.env.NODE_ENV === 'production';
  const swaggerEnabled = !isProduction && process.env.SWAGGER_ENABLED !== 'false';
  
  if (swaggerEnabled) {
    const config = createSwaggerConfig();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log('📘 Swagger docs: /docs');
  } else {
    console.log('📘 Swagger deshabilitado');
  }
  
  await app.listen(port);
  console.log(`✅ API running on http://localhost:${port}`);
}

bootstrap();
