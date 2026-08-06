import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BUSINESS_TIMEZONE } from '../common/time/business-date.js';
import { ExpirationService } from './expiration.service.js';

@Injectable()
export class ExpirationScheduler {
  private readonly logger = new Logger(ExpirationScheduler.name);

  constructor(private readonly expiration: ExpirationService) {}

  @Cron('0 7 * * *', { name: 'inventory-expiration-daily', timeZone: BUSINESS_TIMEZONE })
  async runDaily() {
    try {
      await this.expiration.scanAndNotify();
    } catch (error) {
      this.logger.error(
        'La revisión diaria de caducidades falló',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
