import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { DemandHistoryService } from './demand-history.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BranchScopeModule } from '../branch-scope/branch-scope.module.js';

@Module({
  imports: [PrismaModule, AuthModule, BranchScopeModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DemandHistoryService],
  exports: [AnalyticsService, DemandHistoryService],
})
export class AnalyticsModule {}
