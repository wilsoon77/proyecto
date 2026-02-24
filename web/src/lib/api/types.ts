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
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'
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
export interface ApiProduct {
  id: number
  sku: string
  name: string
  slug: string
  description?: string
  price: number
  discountPct?: number
  isNew: boolean
  category: string
  categorySlug: string
  origin: 'PRODUCIDO' | 'COMPRADO'
  isActive: boolean
  isAvailable: boolean
  images: ApiProductImage[]
  available?: number // Stock disponible (si se incluye branch)
  createdAt: string
  updatedAt: string
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
  price: number
  discountPct?: number
  isNew?: boolean
  categoryId: number
  origin?: 'PRODUCIDO' | 'COMPRADO'
}

export interface UpdateProductDto {
  name?: string
  description?: string
  price?: number
  discountPct?: number
  isNew?: boolean
  categoryId?: number
  origin?: 'PRODUCIDO' | 'COMPRADO'
  isActive?: boolean
  isAvailable?: boolean
}

// ==================== CATEGORÍAS ====================
export interface ApiCategory {
  id: number
  name: string
  slug: string
  description?: string
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
  createdAt: string
}

// ==================== DIRECCIONES ====================
export interface ApiAddress {
  id: number
  userId?: string
  street: string
  city: string
  state?: string
  zone?: string
  reference?: string
  createdAt: string
}

export interface CreateAddressDto {
  street: string
  city: string
  state?: string
  zone?: string
  reference?: string
}

// ==================== ÓRDENES ====================
export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'IN_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PICKED_UP'

export interface ApiOrder {
  id: number
  orderNumber: string
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod?: string
  shippingMethod?: string
  customerNotes?: string
  branch?: ApiBranch
  address?: ApiAddress
  items: ApiOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface ApiOrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
}

export interface ReserveOrderDto {
  branchSlug: string
  paymentMethod?: string
  items: { productSlug: string; quantity: number }[]
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

// ==================== DASHBOARD ====================
export interface DashboardStats {
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    pendingOrders: number
    activeProducts: number
    totalCategories: number
    totalBranches: number
  }
  last30Days: {
    ordersCount: number
    revenue: number
    avgOrderValue: number
  }
  ordersByStatus: { status: string; count: number }[]
  topProducts: { productId: number; name: string; slug: string; totalSold: number }[]
  lowStockProducts: { productId: number; productName: string; branchName: string; available: number }[]
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
}

export interface OrderFilters {
  branchSlug?: string
  status?: OrderStatus
  page?: number
  pageSize?: number
}
