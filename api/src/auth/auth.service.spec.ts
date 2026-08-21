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
  const logger: Record<string, any> = { info: jest.fn(), warn: jest.fn(), auditLogin: jest.fn() };
  const supabase: Record<string, any> = { getUser: jest.fn(), signInWithPassword: jest.fn(), isConfigured: jest.fn() };
  const tokenService = {
    signAccessToken: jest.fn().mockReturnValue('app-access-token'),
    createRefreshToken: jest.fn().mockResolvedValue('app-refresh-token'),
  };
  const passwordService: Record<string, any> = { compare: jest.fn(), hash: jest.fn() };
  const sessionService: Record<string, any> = { requiresCaptcha: jest.fn(), recordLoginAttempt: jest.fn(), upsertTrustedDevice: jest.fn() };
  const captcha = { isConfigured: jest.fn().mockReturnValue(false), verify: jest.fn() };

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

  it('allows login with local passwordHash when user is not found in Supabase Auth (seeded users)', async () => {
    const adminUser = {
      id: 'admin-local-id',
      email: 'admin@panaderia.com',
      passwordHash: '$2a$10$hashedAdminPassword',
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      isActive: true,
    };

    prisma.user.findUnique.mockResolvedValue(adminUser);
    supabase.isConfigured = jest.fn().mockReturnValue(true);
    supabase.signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });
    passwordService.compare = jest.fn().mockResolvedValue(true);
    sessionService.requiresCaptcha = jest.fn().mockResolvedValue(false);
    sessionService.recordLoginAttempt = jest.fn().mockResolvedValue(undefined);
    sessionService.upsertTrustedDevice = jest.fn().mockResolvedValue(undefined);
    logger.auditLogin = jest.fn();

    const result = await service.login({
      email: 'admin@panaderia.com',
      password: 'admin123',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@panaderia.com' } });
    expect(supabase.signInWithPassword).toHaveBeenCalledWith('admin@panaderia.com', 'admin123');
    expect(passwordService.compare).toHaveBeenCalledWith('admin123', adminUser.passwordHash);
    expect(tokenService.signAccessToken).toHaveBeenCalledWith(adminUser.id, adminUser.role);
    expect(result.user.email).toBe('admin@panaderia.com');
  });
});
