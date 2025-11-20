import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { StockMovementsModule } from './stock-movements/stock-movements.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { MetricsModule } from './metrics/metrics.module.js';

@Module({
  imports: [ProductsModule, InventoryModule, StockMovementsModule, OrdersModule, AuthModule, HealthModule, MetricsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
