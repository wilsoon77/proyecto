import { Module } from '@nestjs/common';
import { ForecastController } from './forecast.controller.js';
import { ForecastScheduler } from './forecast.scheduler.js';
import { ForecastService } from './forecast.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BranchScopeModule } from '../branch-scope/branch-scope.module.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [PrismaModule, AuthModule, BranchScopeModule, AnalyticsModule, NotificationsModule],
  controllers: [ForecastController],
  providers: [ForecastService, ForecastScheduler],
  exports: [ForecastService],
})
export class ForecastModule {}
