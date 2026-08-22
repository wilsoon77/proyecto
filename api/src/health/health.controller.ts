import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check de la API',
    description: 'Verifica que el proceso NestJS esté activo y respondiendo.',
  })
  @ApiResponse({ status: 200, description: 'API en ejecución' })
  checkLive() {
    return {
      status: 'ok',
      service: 'api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({
    summary: 'Health check de la Base de Datos',
    description: 'Verifica la conexión activa con la base de datos PostgreSQL mediante Prisma.',
  })
  @ApiResponse({ status: 200, description: 'Base de datos conectada' })
  @ApiResponse({ status: 503, description: 'Base de datos desconectada o inaccesible' })
  async checkDb() {
    if (process.env.SKIP_DB === '1') {
      return {
        status: 'ok',
        database: 'mocked',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          database: 'disconnected',
          message: error instanceof Error ? error.message : 'Database unavailable',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Estado general del sistema',
    description: 'Devuelve estado consolidado de API, Base de Datos y Supabase.',
  })
  @ApiResponse({ status: 200, description: 'Sistema operativo' })
  @ApiResponse({ status: 503, description: 'Sistema degradado' })
  async check() {
    let db = false;
    if (process.env.SKIP_DB === '1') {
      db = true;
    } else {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        db = true;
      } catch {
        db = false;
      }
    }

    const response = {
      status: db ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db,
      supabaseAuth: this.supabase.isConfigured(),
    };

    if (!db) {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }
}

