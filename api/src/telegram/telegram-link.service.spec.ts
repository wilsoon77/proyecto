import { BadRequestException, HttpStatus } from '@nestjs/common';
import { TelegramLinkService } from './telegram-link.service.js';

describe('TelegramLinkService security limits', () => {
  const config = {
    get: jest.fn((key: string) => ({
      TELEGRAM_LINK_MAX_FAILED_ATTEMPTS: key === 'TELEGRAM_LINK_MAX_FAILED_ATTEMPTS' ? '5' : undefined,
      TELEGRAM_LINK_BLOCK_MINUTES: key === 'TELEGRAM_LINK_BLOCK_MINUTES' ? '15' : undefined,
    }[key])),
  };
  const audit = {
    log: jest.fn().mockResolvedValue(undefined),
    getUserName: jest.fn().mockResolvedValue('Sistema'),
  };
  const notifications = { sendToUser: jest.fn().mockResolvedValue(undefined) };
  const policy = { assertEligible: jest.fn() };
  const tx = {
    telegramLinkToken: { findFirst: jest.fn() },
  };
  const prisma = {
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
      notifications as never,
      policy as never,
    );
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
