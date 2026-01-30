import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API', description: 'Devuelve estado general del proceso y verificación básica de DB.' })
  async check() {
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      db,
      supabaseAuth: this.supabase.isConfigured(),
    };
  }
}
