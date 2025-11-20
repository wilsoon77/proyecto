/**
 * Constantes de la aplicación para Guatemala
 */

// Configuración de moneda
export const CURRENCY = {
  code: 'GTQ',
  symbol: 'Q',
  name: 'Quetzal Guatemalteco',
} as const

// Configuración de envío
export const SHIPPING = {
  country: 'Guatemala',
  baseFee: 15.00, // Q15 envío básico
  freeShippingThreshold: 100.00, // Envío gratis en compras > Q100
  minOrderAmount: 25.00, // Pedido mínimo Q25
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
  IN_DELIVERY: 'in_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.CONFIRMED]: 'Confirmado',
  [ORDER_STATUS.PREPARING]: 'En Preparación',
  [ORDER_STATUS.READY]: 'Listo',
  [ORDER_STATUS.IN_DELIVERY]: 'En Camino',
  [ORDER_STATUS.DELIVERED]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
} as const
