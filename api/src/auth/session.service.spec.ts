import { SessionService } from './session.service.js';

describe('SessionService progressive captcha', () => {
  const prisma = {
    loginAttempt: {
      create: jest.fn(),
      count: jest.fn(),
    },
    trustedDevice: {
      findFirst: jest.fn(),
    },
  };

  const service = new SessionService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.trustedDevice.findFirst.mockResolvedValue(null);
  });

  it('requires captcha after three recent failed authentication attempts', async () => {
    prisma.loginAttempt.count.mockResolvedValue(3);

    await expect(service.requiresCaptcha('cliente@example.com', '203.0.113.10', 'device-1')).resolves.toBe(true);

    expect(prisma.loginAttempt.count).toHaveBeenCalledWith({
      where: {
        OR: [
          expect.objectContaining({ email: 'cliente@example.com', success: false }),
          expect.objectContaining({ ipAddress: '203.0.113.10', success: false }),
        ],
      },
    });
  });

  it('keeps trusted devices exempt from progressive captcha', async () => {
    prisma.trustedDevice.findFirst.mockResolvedValue({ id: 'trusted-device' });
    prisma.loginAttempt.count.mockResolvedValue(10);

    await expect(service.requiresCaptcha('cliente@example.com', '203.0.113.10', 'device-1')).resolves.toBe(false);

    expect(prisma.loginAttempt.count).not.toHaveBeenCalled();
  });
});
