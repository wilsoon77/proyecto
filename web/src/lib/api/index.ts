/**
 * Barrel export de todos los servicios de API
 */

// Cliente HTTP base
export { api, api as apiClient, ApiClientError, getToken, clearTokens, isAuthenticated, setTokens, syncTokensFromCookies } from './client'

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
export type { InventoryItem, StockMovement, CreateStockMovementData, StockMovementType, StockMovementsListResponse } from './inventory'
export { productionService } from './production.service'
export type { Recipe, ProductionLog, ProductionResult } from './production.service'
export { rawMaterialsService } from './raw-materials'
export type { RawMaterial, RawMaterialInventory, PurchaseRawMaterialData, PurchaseRawMaterialResult } from './raw-materials'
export { auditService } from './audit'
export type { AuditLog, AuditListFilters, AuditListResponse, AuditStats, AuditFilterOptions } from './audit'
export { systemConfigService } from './system-config'
export { notificationsService } from './notifications'
export type { SystemConfig, Notification, NotificationConfig, SubscribePushDto } from './types'
export type { ProductDetailResponse, CreateProductData, UpdateProductData } from './admin.service'
export type { User, UserRole, CreateUserData, UpdateUserData } from './users'


// Transformadores
export * from './transformers'

// Tipos
export * from './types'
