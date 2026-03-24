import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const bcrypt = bcryptjs.default || bcryptjs;

const prisma = new PrismaClient();

async function main() {
  // Users con diferentes roles
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const bakerPassword = await bcrypt.hash('panadero123', 10);
  const cashierPassword = await bcrypt.hash('cajero123', 10);
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
    where: { email: 'cajero@panaderia.com' },
    update: {},
    create: {
      email: 'cajero@panaderia.com',
      passwordHash: cashierPassword,
      firstName: 'Ana',
      lastName: 'Martínez',
      role: 'CASHIER',
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
      update: {},
      create: c,
    });
  }

  // Branches
  const branches = [
    { name: 'Sucursal Central', slug: 'central', address: 'Zona 10, Guatemala City', phone: '+50212345678' },
    { name: 'Sucursal Norte', slug: 'norte', address: 'Zona 18, Guatemala City', phone: '+50287654321' },
  ];
  for (const b of branches) {
    await prisma.branch.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }

  // Products (basic examples) - Ahora con SKU e isAvailable
  const panCat = await prisma.category.findUnique({ where: { slug: 'pan' } });
  const pastelesCat = await prisma.category.findUnique({ where: { slug: 'pasteles' } });

  if (panCat) {
    await prisma.product.upsert({
      where: { slug: 'pan-frances' },
      update: {},
      create: {
        sku: 'PAN-001',
        name: 'Pan Francés', 
        slug: 'pan-frances', 
        basePrice: 0.50,
        comboQuantity: 3,
        comboPrice: 1.25,
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
  const central = await prisma.branch.findUnique({ where: { slug: 'central' } });
  const norte = await prisma.branch.findUnique({ where: { slug: 'norte' } });
  const panFrances = await prisma.product.findUnique({ where: { slug: 'pan-frances' } });
  const pastelChocolate = await prisma.product.findUnique({ where: { slug: 'pastel-chocolate' } });

  if (central && panFrances) {
    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: panFrances.id, branchId: central.id } },
      update: {},
      create: { productId: panFrances.id, branchId: central.id, quantity: 100 },
    });
  }
  if (norte && panFrances) {
    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: panFrances.id, branchId: norte.id } },
      update: {},
      create: { productId: panFrances.id, branchId: norte.id, quantity: 40 },
    });
  }
  if (central && pastelChocolate) {
    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: pastelChocolate.id, branchId: central.id } },
      update: {},
      create: { productId: pastelChocolate.id, branchId: central.id, quantity: 10 },
    });
  }

  console.log('✅ Seed complete');

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

  // Pan Dulce (necesario para la segunda receta)
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

  // ─────────────────────────────────────────────
  // INVENTARIO DE MATERIA PRIMA (Sucursal Central)
  // ─────────────────────────────────────────────
  if (central) {
    const harina = await prisma.rawMaterial.findUnique({ where: { name: 'Harina' } });
    const levadura = await prisma.rawMaterial.findUnique({ where: { name: 'Levadura' } });
    const sal = await prisma.rawMaterial.findUnique({ where: { name: 'Sal' } });
    const manteca = await prisma.rawMaterial.findUnique({ where: { name: 'Manteca' } });
    const azucar = await prisma.rawMaterial.findUnique({ where: { name: 'Azúcar' } });

    const rmInventory = [
      { rawMaterialId: harina!.id, branchId: central.id, quantity: 500 },  // 500 LB
      { rawMaterialId: levadura!.id, branchId: central.id, quantity: 20 }, // 20 LB
      { rawMaterialId: sal!.id, branchId: central.id, quantity: 30 },       // 30 LB
      { rawMaterialId: manteca!.id, branchId: central.id, quantity: 50 },   // 50 LB
      { rawMaterialId: azucar!.id, branchId: central.id, quantity: 100 },   // 100 LB
    ];

    for (const inv of rmInventory) {
      await prisma.rawMaterialInventory.upsert({
        where: { rawMaterialId_branchId: { rawMaterialId: inv.rawMaterialId, branchId: inv.branchId } },
        update: {},
        create: inv,
      });
    }

    // ─────────────────────────────────────────────
    // RECETAS (Amasijos)
    // ─────────────────────────────────────────────
    if (panFrances && harina && levadura && sal && manteca) {
      const recetaFrances = await prisma.recipe.upsert({
        where: { id: 1 }, // Will create if not exists
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

    const panDulce = await prisma.product.findUnique({ where: { slug: 'pan-dulce' } });
    if (panDulce && harina && levadura && azucar && manteca) {
      const recetaDulce = await prisma.recipe.upsert({
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
      where: { email: { in: ['gerente@panaderia.com', 'panadero@panaderia.com', 'cajero@panaderia.com'] } },
      data: { branchId: central.id },
    });
  }

  console.log('🧑‍🍳 Materia prima, recetas e inventario seedeados');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
