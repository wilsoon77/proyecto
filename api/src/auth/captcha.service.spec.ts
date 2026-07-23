import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { CaptchaService } from './captcha.service.js';

describe('CaptchaService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.HCAPTCHA_SECRET;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalSecret === undefined) delete process.env.HCAPTCHA_SECRET;
    else process.env.HCAPTCHA_SECRET = originalSecret;
  });

  it('does not block local development when hCaptcha is intentionally unconfigured', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.HCAPTCHA_SECRET;

    await expect(new CaptchaService().verify(undefined)).resolves.toBeUndefined();
  });

  it('fails closed in production when a required hCaptcha integration is not configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.HCAPTCHA_SECRET;

    await expect(new CaptchaService().verify(undefined)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('requires a token whenever hCaptcha is configured', async () => {
    process.env.NODE_ENV = 'development';
    process.env.HCAPTCHA_SECRET = 'test-secret';

    await expect(new CaptchaService().verify(undefined)).rejects.toBeInstanceOf(BadRequestException);
  });
});
