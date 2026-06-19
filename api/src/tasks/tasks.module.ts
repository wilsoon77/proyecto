import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [TasksService],
})
export class TasksModule {}
