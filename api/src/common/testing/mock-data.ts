/**
 * Fixtures y Mocks de datos estándar (basados en seed.ts)
 * Para uso seguro en pruebas unitarias, de integración y regresión sin tocar la BD real.
 */

export const MOCK_BRANCHES = [
  {
    id: 1,
    name: 'Sucursal Central',
    slug: 'central',
    address: 'Aldea Buena Vista, Zona 8, Sector Sur, Chimaltenango',
    phone: '+502 1234-5678',
    latitude: 14.664106,
    longitude: -90.845432,
    isActive: true,
  },
  {
    id: 33,
    name: 'Sucursal Secundaria',
    slug: 'secundaria',
    address: 'Frente a Pradera Chimaltenango, Chimaltenango',
    phone: '+502 8765-4321',
    latitude: 14.6597265,
    longitude: -90.809855,
    isActive: true,
  },
  {
    id: 2,
    name: 'Sucursal Norte',
    slug: 'norte',
    address: 'Zona 18, Guatemala City',
    phone: '+502 8765-4321',
    latitude: null,
    longitude: null,
    isActive: true,
  },
];

export const MOCK_USERS = [
  {
    id: 'user-admin-1',
    email: 'admin@panaderia.com',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'ADMIN',
    isActive: true,
    branchId: null,
    assistantAccess: { enabled: true, scope: 'ALL_BRANCHES' },
  },
  {
    id: 'user-manager-1',
    email: 'gerente@panaderia.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'MANAGER',
    isActive: true,
    branchId: 1,
    assistantAccess: { enabled: true, scope: 'ALL_BRANCHES' },
  },
  {
    id: 'user-baker-1',
    email: 'panadero@panaderia.com',
    firstName: 'Carlos',
    lastName: 'López',
    role: 'BAKER',
    isActive: true,
    branchId: 1,
  },
  {
    id: 'user-customer-1',
    email: 'cliente@panaderia.com',
    firstName: 'María',
    lastName: 'García',
    role: 'CUSTOMER',
    isActive: true,
    branchId: null,
  },
];

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Pan', slug: 'pan', description: 'Variedad de panes frescos' },
  { id: 2, name: 'Pasteles', slug: 'pasteles', description: 'Tortas y pasteles' },
  { id: 3, name: 'Galletas', slug: 'galletas', description: 'Galletas y bocadillos dulces' },
  { id: 4, name: 'Dulces', slug: 'dulces', description: 'Repostería y productos azucarados' },
];

export const MOCK_PRODUCTS = [
  {
    id: 11,
    sku: 'PAN-001',
    name: 'Pan Francés',
    slug: 'pan-frances',
    basePrice: 0.50,
    comboQuantity: 3,
    comboPrice: 1.25,
    stockUnitLabel: 'piezas',
    unitsPerTray: 36,
    origin: 'PRODUCIDO',
    tracksExpiration: false,
    isAvailable: true,
    categoryId: 1,
  },
  {
    id: 13,
    sku: 'PAN-002',
    name: 'Pan Dulce',
    slug: 'pan-dulce',
    basePrice: 0.50,
    comboQuantity: 3,
    comboPrice: 1.25,
    stockUnitLabel: 'piezas',
    unitsPerTray: 24,
    origin: 'PRODUCIDO',
    tracksExpiration: false,
    isAvailable: true,
    categoryId: 4,
  },
  {
    id: 12,
    sku: 'PAST-001',
    name: 'Pastel Chocolate',
    slug: 'pastel-chocolate',
    basePrice: 45.00,
    origin: 'PRODUCIDO',
    tracksExpiration: false,
    isAvailable: true,
    categoryId: 2,
  },
  {
    id: 49,
    sku: 'VEN-001',
    name: 'Jugo de Naranja 500ml',
    slug: 'jugo-naranja-500ml',
    basePrice: 8.00,
    origin: 'COMPRADO',
    tracksExpiration: true,
    isAvailable: true,
    categoryId: 4,
  },
];

export const MOCK_RAW_MATERIALS = [
  { id: 1, name: 'Harina', baseUnit: 'LB', costPerUnit: 2.50, minStock: 50 },
  { id: 2, name: 'Levadura', baseUnit: 'LB', costPerUnit: 15.00, minStock: 5 },
  { id: 3, name: 'Sal', baseUnit: 'LB', costPerUnit: 1.00, minStock: 10 },
  { id: 4, name: 'Manteca', baseUnit: 'LB', costPerUnit: 8.00, minStock: 10 },
  { id: 5, name: 'Azúcar', baseUnit: 'LB', costPerUnit: 3.50, minStock: 20 },
];

export const MOCK_RAW_MATERIAL_INVENTORY = [
  { id: 1, rawMaterialId: 1, branchId: 1, quantity: 450, isLow: false },
  { id: 2, rawMaterialId: 2, branchId: 1, quantity: 3, isLow: true }, // Alerta de stock bajo
  { id: 3, rawMaterialId: 3, branchId: 1, quantity: 25, isLow: false },
  { id: 4, rawMaterialId: 4, branchId: 1, quantity: 40, isLow: false },
  { id: 5, rawMaterialId: 5, branchId: 1, quantity: 80, isLow: false },
];

export const MOCK_INVENTORY_ITEMS = [
  {
    id: 1,
    productId: 11,
    branchId: 1,
    quantity: 180,
    reserved: 0,
    available: 180,
    product: MOCK_PRODUCTS[0],
    branch: MOCK_BRANCHES[0],
    updatedAt: new Date(),
  },
  {
    id: 2,
    productId: 13,
    branchId: 1,
    quantity: 120,
    reserved: 0,
    available: 120,
    product: MOCK_PRODUCTS[1],
    branch: MOCK_BRANCHES[0],
    updatedAt: new Date(),
  },
  {
    id: 3,
    productId: 12,
    branchId: 1,
    quantity: 15,
    reserved: 0,
    available: 15,
    product: MOCK_PRODUCTS[2],
    branch: MOCK_BRANCHES[0],
    updatedAt: new Date(),
  },
  {
    id: 4,
    productId: 49,
    branchId: 1,
    quantity: 30,
    reserved: 0,
    available: 30,
    product: MOCK_PRODUCTS[3],
    branch: MOCK_BRANCHES[0],
    updatedAt: new Date(),
  },
];

/**
 * Función factory para crear un Prisma Mock completo y tipado con datos sembrados.
 */
export function createMockPrismaService(overrides: Record<string, any> = {}) {
  return {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(MOCK_USERS.find((u) => u.id === where.id || u.email === where.email) || null);
      }),
      findMany: jest.fn().mockResolvedValue(MOCK_USERS),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-id', ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...MOCK_USERS[0], ...data })),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
    branch: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(MOCK_BRANCHES.find((b) => b.id === where.id || b.slug === where.slug) || null);
      }),
      findMany: jest.fn().mockResolvedValue(MOCK_BRANCHES),
    },
    product: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(MOCK_PRODUCTS.find((p) => p.id === where.id || p.slug === where.slug) || null);
      }),
      findMany: jest.fn().mockResolvedValue(MOCK_PRODUCTS),
      count: jest.fn().mockResolvedValue(MOCK_PRODUCTS.length),
    },
    inventory: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const item = MOCK_INVENTORY_ITEMS.find(
          (i) => i.productId === where.productId_branchId?.productId && i.branchId === where.productId_branchId?.branchId
        );
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockResolvedValue(MOCK_INVENTORY_ITEMS),
      count: jest.fn().mockResolvedValue(MOCK_INVENTORY_ITEMS.length),
      upsert: jest.fn().mockResolvedValue(MOCK_INVENTORY_ITEMS[0]),
    },
    inventoryLot: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
      count: jest.fn().mockResolvedValue(0),
    },
    alertState: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      upsert: jest.fn().mockResolvedValue({ active: true }),
    },
    rawMaterial: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(MOCK_RAW_MATERIALS.find((rm) => rm.id === where.id || rm.name === where.name) || null);
      }),
      findMany: jest.fn().mockResolvedValue(MOCK_RAW_MATERIALS),
    },
    rawMaterialInventory: {
      findMany: jest.fn().mockResolvedValue(MOCK_RAW_MATERIAL_INVENTORY),
      findFirst: jest.fn().mockResolvedValue(MOCK_RAW_MATERIAL_INVENTORY[0]),
      count: jest.fn().mockResolvedValue(MOCK_RAW_MATERIAL_INVENTORY.length),
    },
    stockMovement: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(21),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 100, ...data })),
      createMany: jest.fn().mockResolvedValue({ count: 21 }),
    },
    productionLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(9),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 50, ...data })),
    },
    $transaction: jest.fn().mockImplementation(async (callbackOrPromises) => {
      if (typeof callbackOrPromises === 'function') {
        return callbackOrPromises(createMockPrismaService(overrides));
      }
      return Promise.all(callbackOrPromises);
    }),
    ...overrides,
  } as any;
}
