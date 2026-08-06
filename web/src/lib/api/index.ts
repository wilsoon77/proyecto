/**
 * Barrel export de todos los servicios de API
 */

// Cliente HTTP base
export { api, api as apiClient, ApiClientError, ensureCsrfToken } from './client'

// Servicios
export { authService } from './auth'
export { productsService } from './products'
export { categoriesService } from './categories'
export { branchesService } from './branches'
export { ordersService } from './orders'
export { addressesService } from './addresses'
export { adminService } from './admin.service'
export { usersService } from './users'
export { inventoryService } from './inventory'
export type { InventoryItem, StockMovement, CreateStockMovementData, StockMovementType, StockMovementsListResponse, ExpirationLot, ExpirationResponse } from './inventory'
export { productionService } from './production.service'
export type { Recipe, ProductionLog, ProductionResult } from './production.service'
export { rawMaterialsService } from './raw-materials'
export type { RawMaterial, RawMaterialInventory, PurchaseRawMaterialData, PurchaseRawMaterialResult } from './raw-materials'
export { auditService } from './audit'
export type { AuditLog, AuditListFilters, AuditListResponse, AuditStats, AuditFilterOptions } from './audit'
export { systemConfigService } from './system-config'
export { notificationsService } from './notifications'
export { telegramService } from './telegram'
export type { SystemConfig, Notification, NotificationConfig, SubscribePushDto } from './types'
export { dailyCloseService } from './daily-close'
export { analyticsService, forecastService } from './analytics'
export type {
  AnalyticsFilters,
  AnalyticsOverview,
  AnalyticsSeriesPoint,
  DrilldownResponse,
  DrilldownRow,
  ForecastItem,
  ForecastRun,
} from './analytics'
export type {
  DailyClosePreview,
  DailyClosePreviewItem,
  DailyCloseSummary,
  DailyCloseItem,
  DailyCloseRecord,
  DailyCloseDetail,
  DailyCloseListResponse,
  DailyCloseListFilters,
  CreateDailyClosePayload,
} from './daily-close'
export type { ProductDetailResponse, CreateProductData, UpdateProductData } from './admin.service'
export type { User, UserRole, CreateUserData, UpdateUserData } from './users'


// Transformadores
export * from './transformers'

// Tipos
export * from './types'
