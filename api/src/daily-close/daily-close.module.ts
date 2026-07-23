import { Module } from '@nestjs/common';
import { DailyCloseController } from './daily-close.controller.js';
import { DailyCloseService } from './daily-close.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DailyCloseController],
  providers: [DailyCloseService],
  exports: [DailyCloseService],
})
export class DailyCloseModule {}
