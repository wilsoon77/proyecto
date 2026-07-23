import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BranchScopeService } from './branch-scope.service.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [BranchScopeService],
  exports: [BranchScopeService],
})
export class BranchScopeModule {}
