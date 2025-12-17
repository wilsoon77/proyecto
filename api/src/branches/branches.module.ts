import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, PrismaService],
  exports: [BranchesService],
})
export class BranchesModule {}
