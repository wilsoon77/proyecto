import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductsModule } from './products/products.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { StockMovementsModule } from './stock-movements/stock-movements.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { UsersModule } from './users/users.module.js';
import { StorageModule } from './storage/storage.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { AuditModule } from './audit/audit.module.js';
import { RecipesModule } from './recipes/recipes.module.js';
import { ProductionModule } from './production/production.module.js';
import { RawMaterialsModule } from './raw-materials/raw-materials.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { SystemConfigModule } from './system-config/system-config.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { BranchScopeModule } from './branch-scope/branch-scope.module.js';
import { DailyCloseModule } from './daily-close/daily-close.module.js';
import { TelegramModule } from './telegram/telegram.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    // Rate Limiting: 100 peticiones por 15 minutos por IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto en ms
      limit: 100, // 100 peticiones por minuto
    }]),
    ScheduleModule.forRoot(), // Revisión programada de caducidades
    AuditModule, // Debe estar primero para que esté disponible globalmente
    BranchScopeModule,
    DailyCloseModule,
    SystemConfigModule,
    NotificationsModule,
    TelegramModule,

    ProductsModule, 
    InventoryModule, 
    StockMovementsModule, 
    OrdersModule, 
    AuthModule, 
    HealthModule, 
    MetricsModule,
    CategoriesModule,
    BranchesModule,
    UsersModule,
    StorageModule,
    SupabaseModule,
    RecipesModule,
    ProductionModule,
    RawMaterialsModule,
    TasksModule, // Limpieza de reservas PENDING no confirmadas
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
