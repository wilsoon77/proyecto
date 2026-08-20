/**
 * Tipos de respuesta de la API
 * Estos tipos coinciden con los DTOs del backend
 */

// ==================== AUTH ====================
export interface AuthResponse {
  token: string
  refreshToken: string
  user: ApiUser
}

export interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN' | 'MANAGER' | 'BAKER'
  isActive: boolean
  branchId?: number | null
  branch?: { id: number; name: string; slug: string } | null
  createdAt: string
  updatedAt: string
}

export interface LoginDto {
  email: string
  password: string
  captchaToken?: string
  rememberMe?: boolean
  deviceId?: string
}

export interface RegisterDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  captchaToken?: string
}

export interface UpdateMeDto {
  firstName?: string
  lastName?: string
  phone?: string
}

// ==================== PRODUCTOS ====================
export interface ApiProductPresentation {
  id: number
  name: string
  unitsInStock: number
  price: number | null
  isForSale: boolean
  isForProduction: boolean
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  available?: number
}

export interface ApiProductPresentationInput {
  id?: number
  name: string
  unitsInStock: number
  price?: number | null
  isForSale?: boolean
  isForProduction?: boolean
  isDefault?: boolean
  isActive?: boolean
  sortOrder?: number
}

export interface ApiProduct {
  id: number
  sku: string
  name: string
  slug: string
  description?: string
  basePrice: number
  isNew: boolean
  category: string
  categorySlug: string
  origin: 'PRODUCIDO' | 'COMPRADO'
  isActive: boolean
  isAvailable: boolean
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  tracksExpiration: boolean
  expirationAlertDays: number[]
  images: ApiProductImage[]
  available?: number // Stock disponible (si se incluye branch)
  createdAt: string
  updatedAt: string
  stockUnitLabel?: string
  presentations?: ApiProductPresentation[]
}

export interface ApiProductImage {
  id: number
  url: string
  position: number
}

export interface CreateProductDto {
  sku: string
  name: string
  slug: string
  description?: string
  basePrice: number
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  isNew?: boolean
  categoryId: number
  origin?: 'PRODUCIDO' | 'COMPRADO'
  isActive?: boolean
  tracksExpiration?: boolean
  expirationAlertDays?: number[]
  stockUnitLabel?: string
  presentations?: ApiProductPresentationInput[]
}

export interface UpdateProductDto {
  name?: string
  description?: string
  basePrice?: number
  comboQuantity?: number
  comboPrice?: number
  unitsPerTray?: number
  isNew?: boolean
  categoryId?: number
  origin?: 'PRODUCIDO' | 'COMPRADO'
  isActive?: boolean
  isAvailable?: boolean
  tracksExpiration?: boolean
  expirationAlertDays?: number[]
  stockUnitLabel?: string
  presentations?: ApiProductPresentationInput[]
}

// ==================== CATEGORÍAS ====================
export interface ApiCategory {
  id: number
  name: string
  slug: string
  description?: string
  isActive?: boolean
  productCount?: number
}

export interface CreateCategoryDto {
  name: string
  slug: string
  description?: string
}

// ==================== SUCURSALES ====================
export interface ApiBranch {
  id: number
  name: string
  slug: string
  address: string
  phone?: string
  latitude?: number
  longitude?: number
  isActive?: boolean
  createdAt: string
}

// ==================== ÓRDENES ====================
export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'CANCELLED'
  | 'PICKED_UP'

export interface ApiOrder {
  id: number
  orderNumber: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  paymentMethod?: 'EFECTIVO'
  customerNotes?: string
  branch?: ApiBranch
  expiresAt?: string | null
  items: ApiOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface ApiOrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  stockQuantity?: number
  unitPrice: number
  lineTotal?: number
  presentationId?: number | null
  presentationName?: string | null
  presentationQuantity?: number | null
  presentationUnits?: number | null
}

export interface ReserveOrderDto {
  branchSlug: string
  paymentMethod?: 'EFECTIVO'
  customerNotes?: string
  items: { productSlug: string; quantity: number; presentationId?: number }[]
}

// ==================== INVENTARIO ====================
export interface ApiInventory {
  id: number
  productId: number
  branchId: number
  quantity: number
  reserved: number
  available: number
  product?: ApiProduct
  branch?: ApiBranch
}

// ==================== PAGINACIÓN ====================
export interface PaginatedMeta {
  total: number
  pageCount: number
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginatedMeta
}

// ==================== ERRORES ====================
export interface ApiError {
  statusCode: number
  message: string | string[]
  error?: string
}

// ==================== FILTROS ====================
export interface ProductFilters {
  search?: string
  category?: string
  min?: number
  max?: number
  sort?: 'precio-asc' | 'precio-desc' | 'nuevo'
  branch?: string
  page?: number
  pageSize?: number
  all?: boolean | string
  status?: 'active' | 'inactive' | 'all'
}

export interface OrderFilters {
  branchSlug?: string
  status?: OrderStatus
  page?: number
  pageSize?: number
}

// ==================== CONFIGURACIÓN ====================
export interface SystemConfig {
  id: number
  key: string
  value: any
  type: string
  category: string
  label: string
  description?: string | null
  isPublic: boolean
  isReadOnly: boolean
  sortOrder: number
  updatedAt: string
  createdAt: string
}

// ==================== NOTIFICACIONES ====================
export interface NotificationConfig {
  id: number
  key: string
  name: string
  description?: string | null
  category: string
  isEnabled: boolean
  title: string
  message: string
  targetRoles: string[]
  channels?: string[] | null
  thresholds?: { threshold: number; unit?: string } | null
  soundType: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: number
  userId: string
  type: string
  title: string
  message: string
  url?: string | null
  icon?: string | null
  isRead: boolean
  readAt?: string | null
  metadata?: any | null
  createdAt: string
}

export interface SubscribePushDto {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}


