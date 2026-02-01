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
export type { ProductDetailResponse, CreateProductData, UpdateProductData } from './admin.service'
export type { User, UserRole, CreateUserData, UpdateUserData } from './users'

// Transformadores
export * from './transformers'

// Tipos
export * from './types'
