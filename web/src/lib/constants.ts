/**
 * Constantes de la aplicación para Guatemala
 */

// URL canónica de producción y resolución dinámica automática
export function getSiteUrl(): string {
  // 1. Prioridad Máxima: Variable de entorno configurada (cuando compres tu dominio propio ej. https://panaderiasvetlana.com)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  // 2. Detección automática de Vercel (toma el dominio asignado en el Dashboard de Vercel)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`.replace(/\/$/, '')
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  }

  // 3. Entorno local de desarrollo
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // 4. Fallback de producción por defecto
  return 'https://panaderiasvetlana.vercel.app'
}

export const SITE_URL = getSiteUrl()

// Configuración de moneda
export const CURRENCY = {
  code: 'GTQ',
  symbol: 'Q',
  name: 'Quetzal Guatemalteco',
} as const

// Configuración de pedidos (solo reserva / recoger en sucursal)
export const ORDER_CONFIG = {
  country: 'Guatemala',
  minOrderAmount: 15.00, // Pedido mínimo Q15
} as const

// Configuración regional
export const LOCALE = {
  language: 'es-GT',
  timezone: 'America/Guatemala',
  country: 'GT',
} as const

// Rutas de la aplicación
export const ROUTES = {
  home: '/',
  products: '/productos',
  product: (slug: string) => `/productos/${slug}`,
  categories: '/categorias',
  category: (slug: string) => `/categorias/${slug}`,
  cart: '/carrito',
  checkout: '/checkout',
  about: '/sobre-nosotros',
  contact: '/contacto',
  branches: '/sucursales',
  privacy: '/privacidad',
  terms: '/terminos',
  cookies: '/cookies',
  orders: '/pedidos',
  order: (id: string) => `/pedidos/${id}`,
  profile: '/perfil',
  login: '/login',
  register: '/registro',
} as const

// Estados de pedidos
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.CONFIRMED]: 'Confirmado',
  [ORDER_STATUS.PREPARING]: 'En Preparación',
  [ORDER_STATUS.READY]: 'Listo para Retirar',
  [ORDER_STATUS.PICKED_UP]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] || status
}
