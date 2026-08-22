import { TelegramDeliveryService } from './telegram-delivery.service.js';

function createService() {
  const config = {
    get: jest.fn((key: string) => key === 'TELEGRAM_BOT_TOKEN' ? 'test-token' : undefined),
  };
  const prisma = {
    telegramLink: {
      findFirst: jest.fn().mockResolvedValue({ chatId: '123' }),
    },
  };
  return new TelegramDeliveryService(config as never, prisma as never);
}

describe('TelegramDeliveryService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('solo marca las dos alertas operativas y no nombres de ingredientes aislados', () => {
    const service = createService();

    expect(service.formatAlert('Aviso general', 'Queda harina en inventario')).toBe('Aviso general\n\nQueda harina en inventario');
    expect(service.formatAlert('Inventario', 'Levadura baja', 'inventory.raw_material_low')).toContain('⚠️');
    expect(service.formatAlert('Producto', 'Caduca pronto', 'inventory.expiration_warning')).toContain('⚠️');
  });

  it('propaga un rechazo de Telegram para que el canal pueda registrarlo', async () => {
    const service = createService();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue(JSON.stringify({ ok: false, description: 'chat not found' })),
    } as never);

    await expect(service.sendToChat('123', 'mensaje')).rejects.toThrow('chat not found');
  });

  it('valida el reintento en texto plano cuando falla el parse mode', async () => {
    const service = createService();
    const fetchMock = jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue(JSON.stringify({ ok: false, description: 'parse error' })),
      } as never)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true })),
      } as never);

    await expect(service.sendToChat('123', '*mensaje*', 'Markdown')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
