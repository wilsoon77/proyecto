import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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

  // Products (basic examples)
  const panCat = await prisma.category.findUnique({ where: { slug: 'pan' } });
  const pastelesCat = await prisma.category.findUnique({ where: { slug: 'pasteles' } });

  if (panCat) {
    await prisma.product.upsert({
      where: { slug: 'pan-frances' },
      update: {},
      create: {
        name: 'Pan Francés', slug: 'pan-frances', price: 2.5, description: 'Pan tradicional fresco', categoryId: panCat.id, isNew: true, origin: 'PRODUCIDO',
      },
    });
  }
  if (pastelesCat) {
    await prisma.product.upsert({
      where: { slug: 'pastel-chocolate' },
      update: {},
      create: {
        name: 'Pastel Chocolate', slug: 'pastel-chocolate', price: 45, description: 'Pastel húmedo de cacao', categoryId: pastelesCat.id, origin: 'PRODUCIDO',
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

  console.log('Seed complete');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
