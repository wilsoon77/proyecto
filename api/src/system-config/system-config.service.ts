import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SystemConfigService {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private readonly CACHE_TTL = 60000; // 60 seconds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene una configuración por clave con caché en memoria.
   */
  async get<T>(key: string): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    const value = config.value as T;
    this.cache.set(key, { value, expiresAt: now + this.CACHE_TTL });

    return value;
  }

  /**
   * Obtiene un boolean de la configuración.
   */
  async getBool(key: string): Promise<boolean> {
    const val = await this.get<any>(key);
    return val === true || val === 'true' || val === 1 || val === '1';
  }

  /**
   * Obtiene un number de la configuración.
   */
  async getNumber(key: string): Promise<number> {
    const val = await this.get<any>(key);
    return Number(val);
  }

  /**
   * Actualiza el valor de una configuración e invalida el caché.
   */
  async set(key: string, value: any): Promise<void> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuración con clave '${key}' no encontrada`);
    }

    if (config.isReadOnly) {
      throw new BadRequestException(`La configuración '${key}' es de solo lectura`);
    }

    // Validar tipo de dato si es necesario
    let typedValue = value;
    if (config.type === 'number') {
      typedValue = Number(value);
      if (isNaN(typedValue)) {
        throw new BadRequestException(`El valor para '${key}' debe ser un número válido`);
      }
    } else if (config.type === 'boolean') {
      typedValue = value === true || value === 'true' || value === 1 || value === '1';
    }

    await this.prisma.systemConfig.update({
      where: { key },
      data: { value: typedValue as any },
    });

    // Invalidar caché
    this.cache.delete(key);
  }

  /**
   * Retorna todas las configuraciones agrupadas o filtradas.
   */
  async getAll(category?: string) {
    return this.prisma.systemConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Retorna las configuraciones públicas como un objeto plano { [key]: value }
   */
  async getPublic(): Promise<Record<string, any>> {
    const configs = await this.prisma.systemConfig.findMany({
      where: { isPublic: true },
    });

    const publicConfigs: Record<string, any> = {};
    for (const config of configs) {
      publicConfigs[config.key] = config.value;
    }

    return publicConfigs;
  }
}
