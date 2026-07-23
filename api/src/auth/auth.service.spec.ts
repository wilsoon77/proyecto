import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

describe('AuthService OAuth callback', () => {
  const user = {
    id: 'supabase-user-id',
    email: 'cliente@example.com',
    firstName: 'Cliente',
    lastName: 'Ejemplo',
    role: 'CUSTOMER',
    isActive: true,
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const supabase = { getUser: jest.fn() };
  const tokenService = {
    signAccessToken: jest.fn().mockReturnValue('app-access-token'),
    createRefreshToken: jest.fn().mockResolvedValue('app-refresh-token'),
  };
  const passwordService = {};
  const sessionService = {};
  const captcha = { isConfigured: jest.fn().mockReturnValue(false) };

  const service = new AuthService(
    prisma as never,
    logger as never,
    supabase as never,
    tokenService as never,
    passwordService as never,
    sessionService as never,
    captcha as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.signAccessToken.mockReturnValue('app-access-token');
    tokenService.createRefreshToken.mockResolvedValue('app-refresh-token');
  });

  it('uses the identity returned by Supabase instead of client-provided data', async () => {
    supabase.getUser.mockResolvedValue({
      id: user.id,
      email: user.email,
      user_metadata: { full_name: 'Cliente Ejemplo' },
      app_metadata: { provider: 'google' },
    });
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.handleOAuthCallback('verified-supabase-access-token', {
      ip: '203.0.113.10',
      userAgent: 'jest',
    });

    expect(supabase.getUser).toHaveBeenCalledWith('verified-supabase-access-token');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
    expect(tokenService.signAccessToken).toHaveBeenCalledWith(user.id, user.role);
    expect(result).toEqual({
      token: 'app-access-token',
      refreshToken: 'app-refresh-token',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  });

  it('rejects an OAuth identity without an email before querying the local user table', async () => {
    supabase.getUser.mockResolvedValue({
      id: 'supabase-user-without-email',
      user_metadata: {},
      app_metadata: {},
    });

    await expect(service.handleOAuthCallback('verified-supabase-access-token')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
