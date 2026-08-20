/**
 * Tipos TypeScript para la aplicación
 */

export interface ProductPresentation {
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

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number // Precio base unitario (mapeado desde basePrice de la API)
  mainImage: string
  imageUrl?: string // URL principal de la imagen
  images?: string[]
  category: string // Cambiado de Category a string
  stock: number
  isAvailable: boolean
  isFeatured: boolean
  isNew?: boolean // Producto nuevo
  origin?: string // PRODUCIDO | COMPRADO
  comboQuantity?: number // Ej: 3 (para "3x Q1.25")
  comboPrice?: number // Ej: 1.25
  unitsPerTray?: number // Unidades por lata (solo PRODUCIDO)
  stockUnitLabel?: string
  presentations?: ProductPresentation[]
  rating?: number
  reviewCount?: number
  tags?: string[]
  allergens?: string[]
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  imageUrl?: string
}

export interface CartItem {
  product: Product
  quantity: number
  presentation?: ProductPresentation
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  total: number
  itemCount: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'cancelled'

export interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  branchSlug?: string
  createdAt: string
  paymentMethod?: 'EFECTIVO'
}
