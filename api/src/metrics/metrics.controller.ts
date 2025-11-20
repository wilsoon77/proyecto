import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import client from 'prom-client';

// Register default metrics once at module load
client.collectDefaultMetrics();

@Controller('metrics')
@ApiTags('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', client.register.contentType)
  @ApiExcludeEndpoint() // omit from swagger UI by default; can be noisy
  async metrics(): Promise<string> {
    return await client.register.metrics();
  }
}
