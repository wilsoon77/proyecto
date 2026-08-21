import { BadRequestException, HttpStatus } from '@nestjs/common';
import { TelegramLinkService } from './telegram-link.service.js';

describe('TelegramLinkService security limits', () => {
  const config = {
    get: jest.fn((key: string) => ({
      TELEGRAM_BOT_USERNAME: 'panaderia_bot',
      TELEGRAM_BOT_TOKEN: 'bot-token',
      TELEGRAM_LINK_MAX_FAILED_ATTEMPTS: key === 'TELEGRAM_LINK_MAX_FAILED_ATTEMPTS' ? '5' : undefined,
      TELEGRAM_LINK_BLOCK_MINUTES: key === 'TELEGRAM_LINK_BLOCK_MINUTES' ? '15' : undefined,
    }[key])),
  };
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
    getUserName: jest.fn().mockResolvedValue('Sistema'),
  };
  const policy = { assertEligible: jest.fn() };
  const tx = {
    telegramLinkToken: { findFirst: jest.fn() },
  };
  const prisma = {
    telegramLinkToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
    },
    telegramLinkAttempt: {
      count: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)),
  };

  let service: TelegramLinkService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TelegramLinkService(
      config as never,
      prisma as never,
      audit as never,
      policy as never,
    );
  });

  it('genera un enlace para la app y otro para navegador con el mismo token', async () => {
    const session = await service.createLinkSession('user-1');

    expect(session.webDeepLink).toBe(session.deepLink);
    expect(session.deepLink).toMatch(/^https:\/\/t\.me\/panaderia_bot\?start=[A-Za-z0-9_-]+$/);
    expect(session.appDeepLink).toMatch(/^tg:\/\/resolve\?domain=panaderia_bot&start=[A-Za-z0-9_-]+$/);
    expect(prisma.telegramLinkToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', usedAt: null, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.telegramLinkToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('audita un token inválido sin almacenar el token en claro', async () => {
    prisma.telegramLinkAttempt.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    tx.telegramLinkToken.findFirst.mockResolvedValue(null);

    await expect(service.consumeToken('token-invalido', 'chat-1')).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.telegramLinkAttempt.create).toHaveBeenCalledWith({
      data: { chatId: 'chat-1', reason: 'invalid_or_expired_token' },
    });
    expect(JSON.stringify(audit.log.mock.calls)).not.toContain('token-invalido');
  });

  it('bloquea temporalmente el chat después del máximo de intentos', async () => {
    prisma.telegramLinkAttempt.count.mockResolvedValue(5);

    await expect(service.consumeToken('otro-token', 'chat-1')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.telegramLinkAttempt.create).not.toHaveBeenCalled();
  });
});
