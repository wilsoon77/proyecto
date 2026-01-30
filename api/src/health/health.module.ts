import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, SupabaseService],
})
export class HealthModule {}
