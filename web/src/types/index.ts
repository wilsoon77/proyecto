/**
 * Tipos TypeScript para la aplicación
 */

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  discount?: number // Porcentaje de descuento
  mainImage: string
  imageUrl?: string // URL principal de la imagen
  images?: string[]
  category: string // Cambiado de Category a string
  stock: number
  isAvailable: boolean
  isFeatured: boolean
  isNew?: boolean // Producto nuevo
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

export interface Address {
  id: number
  street: string
  number: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled'

export interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta' | 'paypal'
  shippingMethod?: 'domicilio' | 'recoger'
  shippingAddress?: Address
  createdAt: string
  estimatedDelivery?: string
}
