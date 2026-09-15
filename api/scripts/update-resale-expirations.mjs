import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔄 ACTUALIZANDO CADUCIDADES Y LOTES PARA PRODUCTOS DE REVENTA');
  console.log('====================================================');

  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
  const centralBranch = branches.find(b => b.slug === 'central' || b.name.toLowerCase().includes('central')) || branches[0];
  console.log(`📍 Sucursal destino: ${centralBranch.name} (ID: ${centralBranch.id})`);

  // Obtener todos los productos comprados / reventa
  const resaleProducts = await prisma.product.findMany({
    where: { origin: 'COMPRADO' },
    include: { category: true }
  });

  console.log(`📦 Encontrados ${resaleProducts.length} productos con origen COMPRADO.`);

  const now = new Date();

  function getShelfLifeDays(p) {
    const slug = (p.slug || '').toLowerCase();

    if (slug.includes('jamon') || slug.includes('salchicha') || slug.includes('medallon') || slug.includes('tortita')) {
      return 35;
    }
    if (slug.includes('leche') || slug.includes('mayonesa') || slug.includes('salsa')) {
      return 60;
    }
    if (slug.includes('coca-cola') || slug.includes('gaseosa') || slug.includes('agua')) {
      return 90;
    }
    if (slug.includes('fideo') || slug.includes('sopa') || slug.includes('galleta')) {
      return 120;
    }
    if (slug.includes('cafe') || slug.includes('chocolate') || slug.includes('azucar') || slug.includes('frijol')) {
      return 180;
    }
    return 90;
  }

  let updatedCount = 0;
  let lotsCreated = 0;

  for (const product of resaleProducts) {
    // 1. Activar tracksExpiration y días de alerta
    await prisma.product.update({
      where: { id: product.id },
      data: {
        tracksExpiration: true,
        expirationAlertDays: [30, 15, 3],
      }
    });
    updatedCount++;

    // 2. Obtener el stock actual en Central
    const inv = await prisma.inventory.findUnique({
      where: {
        productId_branchId: {
          productId: product.id,
          branchId: centralBranch.id,
        }
      }
    });

    const currentStock = inv?.quantity || 0;
    if (currentStock > 0) {
      // 3. Verificar si ya tiene lote activo con caducidad
      const existingLot = await prisma.inventoryLot.findFirst({
        where: {
          productId: product.id,
          branchId: centralBranch.id,
          availableQuantity: { gt: 0 }
        }
      });

      const shelfDays = getShelfLifeDays(product);
      const expiresAt = new Date(now.getTime() + shelfDays * 24 * 60 * 60 * 1000);

      if (existingLot) {
        if (!existingLot.expiresAt) {
          await prisma.inventoryLot.update({
            where: { id: existingLot.id },
            data: { expiresAt }
          });
          lotsCreated++;
        }
      } else {
        await prisma.inventoryLot.create({
          data: {
            productId: product.id,
            branchId: centralBranch.id,
            sourceType: 'APERTURA',
            initialQuantity: currentStock,
            availableQuantity: currentStock,
            expiresAt,
          }
        });
        lotsCreated++;
      }
    }
  }

  console.log(`✅ ${updatedCount} productos actualizados con tracksExpiration = true y alertas.`);
  console.log(`✅ ${lotsCreated} lotes sincronizados con fecha de vencimiento en ${centralBranch.name}.`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error actualizando caducidades:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
