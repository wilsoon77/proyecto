import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { AddressesModule } from './addresses/addresses.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    // Rate Limiting: 100 peticiones por 15 minutos por IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minuto en ms
      limit: 100, // 100 peticiones por minuto
    }]),
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
    AddressesModule,
    DashboardModule,
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
