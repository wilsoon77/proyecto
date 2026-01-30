import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from './roles.guard.js';
import { LoggerService } from '../common/logger/logger.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
      signOptions: { expiresIn: '15m' }, // Access token ahora expira en 15 min
    }),
  ],
  providers: [AuthService, PrismaService, JwtStrategy, RolesGuard, LoggerService, SupabaseService],
  controllers: [AuthController],
  exports: [LoggerService], // Exportamos para usar en otros módulos
})
export class AuthModule {}
