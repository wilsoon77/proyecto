/**
 * Utilidades para transformar datos de la API a tipos del frontend
 */

import type { ApiProduct, ApiCategory, ApiBranch, ApiOrder, ApiUser } from '@/lib/api/types'
import type { Product, Category, User, Order, OrderStatus } from '@/types'

/**
 * Transforma un producto de la API al formato del frontend
 */
export function apiProductToProduct(apiProduct: ApiProduct): Product {
  const mainImage = apiProduct.images?.[0]?.url || ''
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description || '',
    price: Number(apiProduct.price),
    discount: apiProduct.discountPct || undefined,
    mainImage,
    imageUrl: mainImage,
    images: apiProduct.images?.map(img => img.url) || [],
    category: apiProduct.categorySlug || apiProduct.category,
    stock: apiProduct.available ?? 0,
    isAvailable: apiProduct.isAvailable,
    isFeatured: apiProduct.isNew || (apiProduct.discountPct ? apiProduct.discountPct > 0 : false),
    isNew: apiProduct.isNew,
  }
}

/**
 * Transforma una categoría de la API al formato del frontend
 */
export function apiCategoryToCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: apiCategory.slug,
    description: apiCategory.description,
  }
}

/**
 * Transforma un usuario de la API al formato del frontend
 */
export function apiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    phone: apiUser.phone,
  }
}

/**
 * Transforma una orden de la API al formato del frontend
 */
export function apiOrderToOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    status: apiOrder.status.toLowerCase() as OrderStatus,
    items: apiOrder.items.map(item => ({
      product: {
        id: item.productId,
        name: item.productName,
        slug: '',
        description: '',
        price: Number(item.unitPrice),
        mainImage: '',
        category: '',
        stock: 0,
        isAvailable: true,
        isFeatured: false,
      },
      quantity: item.quantity,
    })),
    subtotal: Number(apiOrder.subtotal),
    deliveryFee: Number(apiOrder.deliveryFee),
    discount: Number(apiOrder.discount),
    total: Number(apiOrder.total),
    paymentMethod: apiOrder.paymentMethod as Order['paymentMethod'],
    shippingMethod: apiOrder.shippingMethod as Order['shippingMethod'],
    createdAt: apiOrder.createdAt,
  }
}

/**
 * Placeholder para imagen de producto
 */
export function getProductPlaceholder(category: string): string {
  const emojis: Record<string, string> = {
    pan: '🥖',
    pasteles: '🎂',
    galletas: '🍪',
    dulces: '🍞',
    default: '🥐',
  }
  return emojis[category] || emojis.default
}
