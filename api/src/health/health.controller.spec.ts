import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: { $queryRaw: jest.Mock };
  let mockSupabase: { isConfigured: jest.Mock };

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    mockSupabase = {
      isConfigured: jest.fn().mockReturnValue(true),
    };
    controller = new HealthController(mockPrisma as any, mockSupabase as any);
  });

  describe('checkLive', () => {
    it('debe responder con estado ok y datos de uptime del servicio', () => {
      const result = controller.checkLive();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('api');
      expect(typeof result.uptime).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('checkDb', () => {
    it('debe retornar estado conectado cuando la base de datos responde', async () => {
      const result = await controller.checkDb();
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('debe lanzar HttpException 503 cuando la base de datos falla', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(controller.checkDb()).rejects.toThrow(HttpException);
    });
  });

  describe('check', () => {
    it('debe responder con estado ok si la base de datos está disponible', async () => {
      const result = await controller.check();
      expect(result.status).toBe('ok');
      expect(result.db).toBe(true);
      expect(result.supabaseAuth).toBe(true);
      expect(result.uptime).toBeDefined();
    });

    it('debe lanzar HttpException 503 con estado degraded si la base de datos falla', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB unreachable'));

      await expect(controller.check()).rejects.toThrow(HttpException);
    });
  });
});
