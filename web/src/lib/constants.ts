/**
 * Constantes de la aplicación para Guatemala
 */

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

/** @deprecated Usa ORDER_CONFIG. Mantenido por compatibilidad temporal. */
export const SHIPPING = {
  country: 'Guatemala',
  baseFee: 0,
  freeShippingThreshold: 0,
  minOrderAmount: ORDER_CONFIG.minOrderAmount,
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
  promotions: '/promociones',
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
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.CONFIRMED]: 'Confirmado',
  [ORDER_STATUS.PREPARING]: 'En Preparación',
  [ORDER_STATUS.READY]: 'Listo para Recoger',
  [ORDER_STATUS.PICKED_UP]: 'Recogido',
  [ORDER_STATUS.DELIVERED]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
} as const
