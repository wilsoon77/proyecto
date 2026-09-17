import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { AssistantService } from './assistant.service.js';
import { SystemConfigService } from '../system-config/system-config.service.js';
import { LlmProviderName } from './llm-provider.interface.js';

export class TestProviderDto {
  provider!: LlmProviderName;
  model?: string;
}

export class UpdateAssistantConfigDto {
  provider?: string;
  models?: Record<string, string>;
}

@Controller('assistant')
@ApiTags('assistant')
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  @Get('diagnostics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener diagnóstico de proveedores y modelos de IA' })
  getDiagnostics() {
    return this.assistant.getProviderDiagnostics();
  }

  @Post('test-provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Probar conexión con un proveedor y modelo de IA' })
  async testProvider(@Body() body: TestProviderDto) {
    if (!body?.provider) {
      throw new BadRequestException('El campo provider es requerido');
    }
    return this.assistant.testProvider(body.provider, body.model);
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar proveedor activo y modelos de IA en el sistema' })
  async updateConfig(@Body() body: UpdateAssistantConfigDto) {
    if (body.provider) {
      const allowed = ['auto', 'gemini', 'groq', 'mistral', 'nvidia'];
      const p = body.provider.toLowerCase().trim();
      if (!allowed.includes(p)) {
        throw new BadRequestException(`Proveedor no permitido. Debe ser uno de: ${allowed.join(', ')}`);
      }
      await this.systemConfig.set('assistant.provider', p);
    }

    if (body.models && typeof body.models === 'object') {
      for (const [provider, model] of Object.entries(body.models)) {
        if (typeof model === 'string') {
          await this.systemConfig.set(`assistant.${provider}_model`, model.trim());
        }
      }
    }

    return { success: true };
  }
}
