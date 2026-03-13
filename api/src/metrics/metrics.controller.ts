import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import client from 'prom-client';

// Register default metrics once at module load
client.collectDefaultMetrics();

@Controller('metrics')
@ApiTags('metrics')
export class MetricsController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Header('Content-Type', client.register.contentType)
  @ApiExcludeEndpoint()
  async metrics(): Promise<string> {
    return await client.register.metrics();
  }
}
