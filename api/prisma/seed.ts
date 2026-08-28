import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const bcrypt = (bcryptjs as any).default || bcryptjs;

const prisma = new PrismaClient();

async function main() {
  // Users con diferentes roles
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const bakerPassword = await bcrypt.hash('panadero123', 10);
  const customerPassword = await bcrypt.hash('cliente123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@panaderia.com' },
    update: {},
    create: {
      email: 'admin@panaderia.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'ADMIN',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'gerente@panaderia.com' },
    update: {},
    create: {
      email: 'gerente@panaderia.com',
      passwordHash: managerPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+50212345678',
      role: 'MANAGER',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'panadero@panaderia.com' },
    update: {},
    create: {
      email: 'panadero@panaderia.com',
      passwordHash: bakerPassword,
      firstName: 'Carlos',
      lastName: 'López',
      role: 'BAKER',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'cliente@panaderia.com' },
    update: {},
    create: {
      email: 'cliente@panaderia.com',
      passwordHash: customerPassword,
      firstName: 'María',
      lastName: 'García',
      phone: '+50287654321',
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  // Categories
  const categories = [
    { name: 'Pan', slug: 'pan', description: 'Variedad de panes frescos' },
    { name: 'Pasteles', slug: 'pasteles', description: 'Tortas y pasteles' },
    { name: 'Galletas', slug: 'galletas', description: 'Galletas y bocadillos dulces' },
    { name: 'Dulces', slug: 'dulces', description: 'Repostería y productos azucarados' },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }

  // Branches
  const branches = [
    { 
      name: 'Sucursal Central', 
      slug: 'central', 
      address: 'Aldea Buena Vista, Zona 8, Sector Sur, Chimaltenango', 
      phone: '+502 1234-5678',
      latitude: 14.664106,
      longitude: -90.845432
    },
    { 
      name: 'Sucursal Secundaria', 
      slug: 'secundaria', 
      address: 'Frente a Pradera Chimaltenango, Chimaltenango', 
      phone: '+502 8765-4321',
      latitude: 14.6597265,
      longitude: -90.809855
    },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        address: b.address,
        phone: b.phone,
        latitude: b.latitude,
        longitude: b.longitude,
      },
      create: b,
    });
  }

  // Products (basic examples) - Ahora con SKU e isAvailable
  const panCat = await prisma.category.findUnique({ where: { slug: 'pan' } });
  const pastelesCat = await prisma.category.findUnique({ where: { slug: 'pasteles' } });

  if (panCat) {
    await prisma.product.upsert({
      where: { slug: 'pan-frances' },
      update: { stockUnitLabel: 'piezas' },
      create: {
        sku: 'PAN-001',
        name: 'Pan Francés', 
        slug: 'pan-frances', 
        basePrice: 0.50,
        comboQuantity: 3,
        comboPrice: 1.25,
        stockUnitLabel: 'piezas',
        unitsPerTray: 36,
        description: 'Pan tradicional fresco', 
        categoryId: panCat.id, 
        isNew: true, 
        isAvailable: true,
        origin: 'PRODUCIDO',
      },
    });
  }
  if (pastelesCat) {
    await prisma.product.upsert({
      where: { slug: 'pastel-chocolate' },
      update: {},
      create: {
        sku: 'PAST-001',
        name: 'Pastel Chocolate', 
        slug: 'pastel-chocolate', 
        basePrice: 45, 
        description: 'Pastel húmedo de cacao', 
        categoryId: pastelesCat.id, 
        isAvailable: true,
        origin: 'PRODUCIDO',
      },
    });
  }

  // Inventario inicial (bloqueo lógico): todo físico en quantity
  const panFrances = await prisma.product.findUnique({ where: { slug: 'pan-frances' } });
  if (panFrances) {
    await prisma.productPresentation.upsert({
      where: { productId_name: { productId: panFrances.id, name: 'Media tira' } },
      update: { unitsInStock: 3, price: 1.25, isForSale: true, isForProduction: true, isDefault: false, isActive: true, sortOrder: 0 },
      create: { productId: panFrances.id, name: 'Media tira', unitsInStock: 3, price: 1.25, isForSale: true, isForProduction: true, isDefault: false, isActive: true, sortOrder: 0 },
    });
    await prisma.productPresentation.upsert({
      where: { productId_name: { productId: panFrances.id, name: 'Tira completa' } },
      update: { unitsInStock: 6, price: 2.50, isForSale: true, isForProduction: true, isDefault: true, isActive: true, sortOrder: 1 },
      create: { productId: panFrances.id, name: 'Tira completa', unitsInStock: 6, price: 2.50, isForSale: true, isForProduction: true, isDefault: true, isActive: true, sortOrder: 1 },
    });
  }

  const central = await prisma.branch.findUnique({ where: { slug: 'central' } });
  const secundaria = await prisma.branch.findUnique({ where: { slug: 'secundaria' } });

  // ─────────────────────────────────────────────
  // MATERIA PRIMA (Raw Materials)
  // ─────────────────────────────────────────────
  const rawMaterials = [
    { name: 'Harina', baseUnit: 'LB' as const, costPerUnit: 2.50, minStock: 50 },
    { name: 'Levadura', baseUnit: 'LB' as const, costPerUnit: 15.00, minStock: 5 },
    { name: 'Sal', baseUnit: 'LB' as const, costPerUnit: 1.00, minStock: 10 },
    { name: 'Manteca', baseUnit: 'LB' as const, costPerUnit: 8.00, minStock: 10 },
    { name: 'Azúcar', baseUnit: 'LB' as const, costPerUnit: 3.50, minStock: 20 },
  ];

  for (const rm of rawMaterials) {
    await prisma.rawMaterial.upsert({
      where: { name: rm.name },
      update: {},
      create: rm,
    });
  }

  // Pan Dulce
  const dulcesCat = await prisma.category.findUnique({ where: { slug: 'dulces' } });
  if (dulcesCat) {
    await prisma.product.upsert({
      where: { slug: 'pan-dulce' },
      update: {},
      create: {
        sku: 'PAN-002',
        name: 'Pan Dulce',
        slug: 'pan-dulce',
        basePrice: 0.50,
        comboQuantity: 3,
        comboPrice: 1.25,
        unitsPerTray: 24,
        description: 'Pan dulce tradicional de la abuela',
        categoryId: dulcesCat.id,
        isNew: false,
        isAvailable: true,
        origin: 'PRODUCIDO',
      },
    });
  }

  // Sembrar inventario para TODOS los productos en Central y Secundaria
  const allProducts = await prisma.product.findMany();
  const activeBranches = [central, secundaria].filter(Boolean) as Array<{ id: number; slug: string; name: string }>;

  for (const prod of allProducts) {
    for (const br of activeBranches) {
      const isCentral = br.slug === 'central';
      const baseQty = prod.slug === 'pan-frances' ? (isCentral ? 180 : 90)
        : prod.slug === 'pan-dulce' ? (isCentral ? 120 : 60)
        : prod.slug.includes('pastel') ? (isCentral ? 15 : 8)
        : isCentral ? 50 : 25;

      await prisma.inventory.upsert({
        where: { productId_branchId: { productId: prod.id, branchId: br.id } },
        // El seed debe ser idempotente y no sobrescribir conteos operativos.
        update: {},
        create: { productId: prod.id, branchId: br.id, quantity: baseQty, reserved: 0 },
      });

      // La caducidad solo aplica a productos COMPRADOS con control por lote.
      // Se busca el lote de prueba antes de crearlo para que el seed sea repetible.
      if (prod.origin === 'COMPRADO' && prod.tracksExpiration) {
        const in5Days = new Date();
        in5Days.setHours(0, 0, 0, 0);
        in5Days.setDate(in5Days.getDate() + 5);
        const nextDay = new Date(in5Days);
        nextDay.setDate(nextDay.getDate() + 1);
        const existingSeedLot = await prisma.inventoryLot.findFirst({
          where: {
            productId: prod.id,
            branchId: br.id,
            sourceType: 'COMPRA',
            expiresAt: { gte: in5Days, lt: nextDay },
          },
        });
        if (!existingSeedLot) {
          await prisma.inventoryLot.create({
            data: {
              productId: prod.id,
              branchId: br.id,
              initialQuantity: baseQty,
              availableQuantity: baseQty,
              sourceType: 'COMPRA',
              expiresAt: in5Days,
            },
          });
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // INVENTARIO DE MATERIA PRIMA
  // ─────────────────────────────────────────────
  if (central) {
    const harina = await prisma.rawMaterial.findUnique({ where: { name: 'Harina' } });
    const levadura = await prisma.rawMaterial.findUnique({ where: { name: 'Levadura' } });
    const sal = await prisma.rawMaterial.findUnique({ where: { name: 'Sal' } });
    const manteca = await prisma.rawMaterial.findUnique({ where: { name: 'Manteca' } });
    const azucar = await prisma.rawMaterial.findUnique({ where: { name: 'Azúcar' } });

    const rmInventory = [
      { rawMaterialId: harina!.id, branchId: central.id, quantity: 450 },  // 450 LB
      { rawMaterialId: levadura!.id, branchId: central.id, quantity: 3 },  // 3 LB (BAJA para disparar indicador)
      { rawMaterialId: sal!.id, branchId: central.id, quantity: 25 },      // 25 LB
      { rawMaterialId: manteca!.id, branchId: central.id, quantity: 40 },  // 40 LB
      { rawMaterialId: azucar!.id, branchId: central.id, quantity: 80 },   // 80 LB
    ];

    for (const inv of rmInventory) {
      await prisma.rawMaterialInventory.upsert({
        where: { rawMaterialId_branchId: { rawMaterialId: inv.rawMaterialId, branchId: inv.branchId } },
        update: {},
        create: inv,
      });
    }

    if (secundaria) {
      const rmInventorySec = [
        { rawMaterialId: harina!.id, branchId: secundaria.id, quantity: 200 },
        { rawMaterialId: levadura!.id, branchId: secundaria.id, quantity: 8 },
        { rawMaterialId: sal!.id, branchId: secundaria.id, quantity: 15 },
        { rawMaterialId: manteca!.id, branchId: secundaria.id, quantity: 20 },
        { rawMaterialId: azucar!.id, branchId: secundaria.id, quantity: 40 },
      ];
      for (const inv of rmInventorySec) {
        await prisma.rawMaterialInventory.upsert({
          where: { rawMaterialId_branchId: { rawMaterialId: inv.rawMaterialId, branchId: inv.branchId } },
          update: {},
          create: inv,
        });
      }
    }

    // ─────────────────────────────────────────────
    // MOVIMIENTOS OPERATIVOS DE LOS ÚLTIMOS 7 DÍAS
    // ─────────────────────────────────────────────
    const sampleProduct = panFrances || allProducts[0];
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (sampleProduct) {
      // Limpiar movimientos de prueba previos
      await prisma.stockMovement.deleteMany({ where: { referenceId: 'SEED_OPERATIONAL' } });

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(10, 0, 0, 0);

        const prodQty = 120 + (i * 15);
        const soldQty = 95 + (i * 10);
        const wasteQty = 3 + (i % 3);

        await prisma.stockMovement.create({
          data: {
            productId: sampleProduct.id,
            toBranchId: central.id,
            type: 'PRODUCCION',
            quantity: prodQty,
            referenceId: 'SEED_OPERATIONAL',
            note: 'Producción matutina',
            createdAt: d,
          },
        });

        await prisma.stockMovement.create({
          data: {
            productId: sampleProduct.id,
            fromBranchId: central.id,
            type: 'VENTA',
            quantity: soldQty,
            referenceId: 'SEED_OPERATIONAL',
            note: 'Ventas en tienda',
            createdAt: new Date(d.getTime() + 4 * 3600 * 1000),
          },
        });

        await prisma.stockMovement.create({
          data: {
            productId: sampleProduct.id,
            fromBranchId: central.id,
            type: 'MERMA',
            quantity: wasteQty,
            referenceId: 'SEED_OPERATIONAL',
            note: 'Merma por descarte',
            createdAt: new Date(d.getTime() + 8 * 3600 * 1000),
          },
        });
      }
    }

    // ─────────────────────────────────────────────
    // RECETAS (Amasijos)
    // ─────────────────────────────────────────────
    if (panFrances && harina && levadura && sal && manteca) {
      await prisma.recipe.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'Amasijo Estándar de Francés',
          productId: panFrances.id,
          standardTrays: 33,
          ingredients: {
            create: [
              { rawMaterialId: harina.id, quantity: 50 },    // 50 LB harina
              { rawMaterialId: levadura.id, quantity: 2 },   // 2 LB levadura
              { rawMaterialId: sal.id, quantity: 1 },        // 1 LB sal
              { rawMaterialId: manteca.id, quantity: 3 },    // 3 LB manteca
            ],
          },
        },
      });
    }

    // Registro de producción de hoy para el indicador del dashboard.
    // Se crea después de las recetas y solo una vez por día de seed.
    if (adminUser && central) {
      const receta = await prisma.recipe.findFirst({ orderBy: { id: 'asc' } });
      if (receta) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existingProduction = await prisma.productionLog.findFirst({
          where: {
            recipeId: receta.id,
            branchId: central.id,
            note: 'SEED: Producción del día',
            createdAt: { gte: today, lt: tomorrow },
          },
        });
        if (!existingProduction) {
          await prisma.productionLog.create({
            data: {
              recipeId: receta.id,
              branchId: central.id,
              userId: adminUser.id,
              traysProduced: 12,
              unitsProduced: 432,
              note: 'SEED: Producción del día',
              createdAt: new Date(),
            },
          });
        }
      }
    }

    const panDulce = await prisma.product.findUnique({ where: { slug: 'pan-dulce' } });
    if (panDulce && harina && levadura && azucar && manteca) {
      await prisma.recipe.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Amasijo Estándar de Pan Dulce',
          productId: panDulce.id,
          standardTrays: 25,
          ingredients: {
            create: [
              { rawMaterialId: harina.id, quantity: 40 },    // 40 LB harina
              { rawMaterialId: levadura.id, quantity: 1.5 },  // 1.5 LB levadura
              { rawMaterialId: azucar.id, quantity: 10 },    // 10 LB azúcar
              { rawMaterialId: manteca.id, quantity: 5 },    // 5 LB manteca
            ],
          },
        },
      });
    }

    // Asignar sucursal central a los empleados operativos
    await prisma.user.updateMany({
      where: { email: { in: ['gerente@panaderia.com', 'panadero@panaderia.com'] } },
      data: { branchId: central.id },
    });
  }

  console.log('🧑‍🍳 Materia prima, recetas e inventario seedeados');

  // ─────────────────────────────────────────────
  // CONFIGURACIÓN GLOBAL DEL SISTEMA (System Config)
  // ─────────────────────────────────────────────
  const systemConfigs = [
    {
      key: 'store.name',
      value: 'Panadería Svetlana',
      type: 'string',
      category: 'STORE',
      label: 'Nombre de la tienda',
      description: 'Nombre principal de la panadería que se muestra en el sitio web.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 1,
    },
    {
      key: 'store.description',
      value: 'Los mejores panes de masa madre y repostería artesanal.',
      type: 'string',
      category: 'STORE',
      label: 'Descripción de la tienda',
      description: 'Descripción que se muestra en los motores de búsqueda y la página de inicio.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 2,
    },
    {
      key: 'store.currency',
      value: 'GTQ',
      type: 'string',
      category: 'STORE',
      label: 'Moneda',
      description: 'Código de moneda de tres letras para la tienda.',
      isPublic: true,
      isReadOnly: true,
      sortOrder: 3,
    },
    {
      key: 'store.currency_symbol',
      value: 'Q',
      type: 'string',
      category: 'STORE',
      label: 'Símbolo de moneda',
      description: 'Símbolo de moneda para mostrar los precios.',
      isPublic: true,
      isReadOnly: true,
      sortOrder: 4,
    },
    {
      key: 'store.timezone',
      value: 'America/Guatemala',
      type: 'string',
      category: 'STORE',
      label: 'Zona horaria',
      description: 'Zona horaria de operación de la tienda.',
      isPublic: true,
      isReadOnly: true,
      sortOrder: 5,
    },
    {
      key: 'store.operating_hours',
      value: 'Lunes a Sábado: 7:00 AM - 8:00 PM',
      type: 'string',
      category: 'STORE',
      label: 'Horario de operación',
      description: 'Horario en el que la tienda está abierta al público.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 6,
    },
    {
      key: 'orders.min_amount',
      value: 15,
      type: 'number',
      category: 'ORDERS',
      label: 'Pedido mínimo (Q)',
      description: 'Monto mínimo total requerido para poder realizar un pedido.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 7,
    },
    {
      key: 'orders.max_items',
      value: 50,
      type: 'number',
      category: 'ORDERS',
      label: 'Máximo items por pedido',
      description: 'Cantidad máxima total de productos que se pueden agregar a un solo pedido.',
      isPublic: false,
      isReadOnly: false,
      sortOrder: 8,
    },
    {
      key: 'orders.accept_orders',
      value: true,
      type: 'boolean',
      category: 'OPERATIONS',
      label: 'Aceptar pedidos',
      description: 'Habilita o deshabilita la posibilidad de realizar pedidos en línea.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 9,
    },
    {
      key: 'orders.catalog_only',
      value: false,
      type: 'boolean',
      category: 'OPERATIONS',
      label: 'Catálogo solo informativo',
      description: 'Muestra productos y precios públicamente, pero deshabilita la compra y las nuevas reservas.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 10,
    },
    {
      key: 'operations.maintenance_mode',
      value: false,
      type: 'boolean',
      category: 'OPERATIONS',
      label: 'Modo mantenimiento',
      description: 'Habilita el modo mantenimiento para suspender temporalmente el acceso público.',
      isPublic: true,
      isReadOnly: false,
      sortOrder: 11,
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        ...config,
        value: config.value as any,
      },
    });
  }

  console.log('⚙️ Configuración del sistema seedeada');

  // ─────────────────────────────────────────────
  // CONFIGURACIÓN DE NOTIFICACIONES (Notification Config)
  // ─────────────────────────────────────────────
  const notificationConfigs = [
    {
      key: 'inventory.raw_material_low',
      name: 'Materia prima baja',
      description: 'Alerta cuando la materia prima disponible cae por debajo del mínimo configurado.',
      category: 'INVENTORY',
      isEnabled: true,
      title: 'Materia prima baja',
      message: 'Materia prima baja: {materialName} tiene {current} {unit} en {branchName}',
      targetRoles: ['ADMIN', 'MANAGER'],
      thresholds: { threshold: 50, unit: 'LB' },
      soundType: 'importante',
    },
    {
      key: 'inventory.expiration_warning',
      name: 'Producto próximo a caducar',
      description: 'Avisa cuando un lote comprado entra en el período configurado antes de caducar.',
      category: 'INVENTORY',
      isEnabled: true,
      title: 'Producto próximo a caducar',
      message: '{productName}: quedan {quantity} unidades y caduca el {expiresAt} ({daysBefore} días de anticipación) en {branchName}',
      targetRoles: ['MANAGER', 'ADMIN'],
      thresholds: null,
      soundType: 'alerta',
    },
  ];

  const operationalNotificationKeys = [
    'inventory.raw_material_low',
    'inventory.expiration_warning',
  ];
  for (const config of notificationConfigs.filter((config) => operationalNotificationKeys.includes(config.key))) {
    await prisma.notificationConfig.upsert({
      where: { key: config.key },
      update: {
        name: config.name,
        description: config.description,
        category: config.category,
        isEnabled: config.isEnabled,
        title: config.title,
        message: config.message,
        targetRoles: config.targetRoles as any,
        thresholds: config.thresholds as any,
        soundType: config.soundType,
      },
      create: {
        ...config,
        targetRoles: config.targetRoles as any,
        thresholds: config.thresholds as any,
      },
    });
  }

  console.log('🔔 Configuraciones de notificación seedeadas');

  const assistantUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    select: { id: true },
  });
  for (const user of assistantUsers) {
    await prisma.assistantAccess.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, enabled: true, scope: 'ALL_BRANCHES' },
    });
  }
  console.log('🤖 Accesos del asistente seedeados');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
