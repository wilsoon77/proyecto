import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BUSINESS_TIMEZONE } from '../common/time/business-date.js';
import { ForecastService } from './forecast.service.js';

@Injectable()
export class ForecastScheduler {
  private readonly logger = new Logger(ForecastScheduler.name);

  constructor(private readonly forecast: ForecastService) {}

  @Cron('0 23 * * *', { name: 'demand-forecast-nightly', timeZone: BUSINESS_TIMEZONE })
  async runNightly() {
    try {
      await this.forecast.generate({ horizonDays: 7 });
      this.logger.log('Predicción nocturna completada');
    } catch (error) {
      this.logger.error('La predicción nocturna falló', error instanceof Error ? error.stack : String(error));
    }
  }
}
