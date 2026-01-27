/**
 * Barrel export de todos los servicios de API
 */

// Cliente HTTP base
export { api, ApiClientError, getToken, clearTokens, isAuthenticated, setTokens } from './client'

// Servicios
export { authService } from './auth'
export { productsService } from './products'
export { categoriesService } from './categories'
export { branchesService } from './branches'
export { ordersService } from './orders'
export { addressesService } from './addresses'

// Transformadores
export * from './transformers'

// Tipos
export * from './types'
