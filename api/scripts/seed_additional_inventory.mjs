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
  console.log('📦 INICIANDO ACTUALIZACIÓN Y SIEMBRA DE INVENTARIO ADICIONAL');
  console.log('====================================================');

  // 1. Obtener sucursales
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
  const centralBranch = branches.find(b => b.slug === 'central' || b.name.toLowerCase().includes('central')) || branches[0];
  console.log(`📍 Sucursal Central identificada: ${centralBranch.name} (ID: ${centralBranch.id})`);
  console.log(`📍 Total sucursales activas: ${branches.length}`);

  // 2. Categorías requeridas
  const categorySlugs = ['abarrotes', 'bebidas', 'dulces', 'galletas', 'pan', 'pan-dulce', 'pasteles', 'donas'];
  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } });
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

  // Asegurar categoría dulces si no estuviese
  if (!categoryMap.has('dulces')) {
    const dulcesCat = await prisma.category.upsert({
      where: { slug: 'dulces' },
      update: {},
      create: { name: 'Dulces y Golosinas', slug: 'dulces', description: 'Chocolates, gelatinas, bombones y golosinas' }
    });
    categoryMap.set('dulces', dulcesCat.id);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. MATERIAS PRIMAS (Exclusivas de Sucursal Central)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🌾 Procesando Materias Primas...');

  const rawMaterialsData = [
    { name: 'Harina Dura', baseUnit: 'LB', costPerUnit: 2.80, minStock: 200, quantity: 1500 }, // 15 Quintales = 1500 LB
    { name: 'Harina Suave', baseUnit: 'LB', costPerUnit: 2.70, minStock: 200, quantity: 500 },  // 5 Quintales = 500 LB
    { name: 'Azúcar Blanca', baseUnit: 'LB', costPerUnit: 3.50, minStock: 20, quantity: 200 },   // 2 Quintales = 200 LB
    { name: 'Levadura', baseUnit: 'LB', costPerUnit: 14.00, minStock: 10, quantity: 50 },         // 50 LB
    { name: 'Polvo de Hornear (Royal)', baseUnit: 'LB', costPerUnit: 12.00, minStock: 10, quantity: 25 }, // 25 LB
    { name: 'Huevos', baseUnit: 'UNIT', costPerUnit: 1.10, minStock: 60, quantity: 300 },        // 300 unidades
    { name: 'Sal', baseUnit: 'LB', costPerUnit: 1.00, minStock: 15, quantity: 30 },              // 30 LB
    { name: 'Bicarbonato de Sodio', baseUnit: 'UNIT', costPerUnit: 1.50, minStock: 10, quantity: 40 }, // 40 paquetes
    { name: 'Pasas', baseUnit: 'LB', costPerUnit: 14.00, minStock: 2, quantity: 5 },              // 5 LB (NUEVO)
    { name: 'Ajonjolí', baseUnit: 'LB', costPerUnit: 12.00, minStock: 1, quantity: 3 },          // 3 LB (NUEVO)
    { name: 'Manteca Vegetal', baseUnit: 'LB', costPerUnit: 8.50, minStock: 25, quantity: 150 }, // 150 LB
    { name: 'Anís', baseUnit: 'LB', costPerUnit: 18.00, minStock: 1, quantity: 2 },              // 2 LB (NUEVO)
    { name: 'Chocolate en Barra (Repostería)', baseUnit: 'LB', costPerUnit: 15.00, minStock: 2, quantity: 3 }, // 3 LB (NUEVO)
    { name: 'Manga de Jalea de Fresa', baseUnit: 'UNIT', costPerUnit: 18.00, minStock: 2, quantity: 4 }, // 4 mangas
    { name: 'Manga de Manjar', baseUnit: 'UNIT', costPerUnit: 20.00, minStock: 2, quantity: 5 },        // 5 mangas
    { name: 'Leche Entera', baseUnit: 'ML', costPerUnit: 0.009, minStock: 2000, quantity: 20000 },      // 20 Litros = 20,000 ML (NUEVO)
    { name: 'Banano', baseUnit: 'UNIT', costPerUnit: 0.75, minStock: 20, quantity: 50 },          // 50 unidades (NUEVO)
    { name: 'Canela en Polvo', baseUnit: 'LB', costPerUnit: 16.00, minStock: 1, quantity: 2 },  // 2 LB (NUEVO)
  ];

  let rawUpdated = 0;
  for (const raw of rawMaterialsData) {
    const rawRecord = await prisma.rawMaterial.upsert({
      where: { name: raw.name },
      update: {
        baseUnit: raw.baseUnit,
        costPerUnit: raw.costPerUnit,
        minStock: raw.minStock,
        isActive: true,
      },
      create: {
        name: raw.name,
        baseUnit: raw.baseUnit,
        costPerUnit: raw.costPerUnit,
        minStock: raw.minStock,
        isActive: true,
      },
    });

    // Actualizar inventario en Sucursal Central
    await prisma.rawMaterialInventory.upsert({
      where: {
        rawMaterialId_branchId: {
          rawMaterialId: rawRecord.id,
          branchId: centralBranch.id,
        },
      },
      update: {
        quantity: raw.quantity,
      },
      create: {
        rawMaterialId: rawRecord.id,
        branchId: centralBranch.id,
        quantity: raw.quantity,
      },
    });
    rawUpdated++;
  }
  console.log(`✅ ${rawUpdated} Materias Primas actualizadas con stock en ${centralBranch.name}.`);

  // ─────────────────────────────────────────────────────────────
  // 4. PRODUCTOS DE TIENDA / REVENTA (Stock en Central, 0 en Secundaria)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🏪 Procesando Productos de Tienda / Reventa...');

  const resaleProductsData = [
    // Chocolates en barra / mesa
    {
      sku: 'ABA-CHO-RIC',
      name: 'Chocolate Rico (Tableta)',
      slug: 'chocolate-rico-tableta',
      description: 'Chocolate tradicional artesanal para preparar con leche o agua.',
      categorySlug: 'abarrotes',
      basePrice: 10.00,
      stockUnitLabel: 'unidades',
      quantity: 60,
    },
    {
      sku: 'ABA-CHO-LEO',
      name: 'Chocolate León (Tableta)',
      slug: 'chocolate-leon-tableta',
      description: 'Tableta de chocolate León tradicional.',
      categorySlug: 'abarrotes',
      basePrice: 10.00,
      stockUnitLabel: 'unidades',
      quantity: 40,
    },
    {
      sku: 'ABA-CHO-XEL',
      name: 'Chocolate Xela (Tableta)',
      slug: 'chocolate-xela-tableta',
      description: 'Auténtico chocolate de Xela con canela y azúcar.',
      categorySlug: 'abarrotes',
      basePrice: 12.00,
      stockUnitLabel: 'unidades',
      quantity: 20,
    },

    // Cafés
    {
      sku: 'ABA-CAF-NES',
      name: 'Café Nescafé Clásico (Sobre)',
      slug: 'cafe-nescafe-clasico-sobre',
      description: 'Sobre individual de café instantáneo Nescafé Clásico.',
      categorySlug: 'abarrotes',
      basePrice: 2.50,
      stockUnitLabel: 'sobres',
      quantity: 100,
    },
    {
      sku: 'ABA-CAF-MUS',
      name: 'Café Musún',
      slug: 'cafe-musun',
      description: 'Café tostado y molido tradicional guatemalteco.',
      categorySlug: 'abarrotes',
      basePrice: 3.00,
      stockUnitLabel: 'unidades',
      quantity: 40,
    },
    {
      sku: 'ABA-CAF-JAR',
      name: 'Café Jarrillita',
      slug: 'cafe-jarrillita',
      description: 'Café molido tradicional de aroma intenso.',
      categorySlug: 'abarrotes',
      basePrice: 2.50,
      stockUnitLabel: 'unidades',
      quantity: 50,
    },
    {
      sku: 'ABA-CAF-QUE',
      name: 'Café Quetzal',
      slug: 'cafe-quetzal',
      description: 'Café nacional en porción individual.',
      categorySlug: 'abarrotes',
      basePrice: 2.50,
      stockUnitLabel: 'unidades',
      quantity: 30,
    },

    // Azúcar y Granos
    {
      sku: 'ABA-AZU-BLA',
      name: 'Azúcar Blanca (Bolsa 1 LB)',
      slug: 'azucar-blanca-bolsa-1-lb',
      description: 'Azúcar blanca refinada por libra.',
      categorySlug: 'abarrotes',
      basePrice: 4.50,
      stockUnitLabel: 'libras',
      quantity: 50,
    },
    {
      sku: 'ABA-AZU-MOR',
      name: 'Azúcar Morena (Bolsa 1 LB)',
      slug: 'azucar-morena-bolsa-1-lb',
      description: 'Azúcar morena natural por libra.',
      categorySlug: 'abarrotes',
      basePrice: 4.50,
      stockUnitLabel: 'libras',
      quantity: 30,
    },
    {
      sku: 'ABA-FRI-DUC',
      name: 'Frijol Ducal Negro (Doypack 430g)',
      slug: 'frijol-ducal-negro-doypack-430g',
      description: 'Frijoles negros volteados tradicionales listos para servir.',
      categorySlug: 'abarrotes',
      basePrice: 8.50,
      stockUnitLabel: 'unidades',
      quantity: 50,
    },
    {
      sku: 'ABA-AVE-MOS',
      name: 'Avena Mosh Tradicional (Bolsa 360g)',
      slug: 'avena-mosh-tradicional-bolsa-360g',
      description: 'Hojuelas de avena enteras para atol nutritivo.',
      categorySlug: 'abarrotes',
      basePrice: 6.50,
      stockUnitLabel: 'unidades',
      quantity: 30,
    },

    // Sopas Instantáneas
    {
      sku: 'ABA-SOP-LAK-POL',
      name: 'Sopa Instantánea Laky Sabor Pollo',
      slug: 'sopa-instantanea-laky-sabor-pollo',
      description: 'Sopa instantánea de fideos con sazonador de pollo.',
      categorySlug: 'abarrotes',
      basePrice: 4.00,
      stockUnitLabel: 'unidades',
      quantity: 60,
    },
    {
      sku: 'ABA-SOP-LAK-CAM',
      name: 'Sopa Instantánea Laky Sabor Camarón',
      slug: 'sopa-instantanea-laky-sabor-camaron',
      description: 'Sopa instantánea de fideos con sazonador de camarón.',
      categorySlug: 'abarrotes',
      basePrice: 4.00,
      stockUnitLabel: 'unidades',
      quantity: 50,
    },
    {
      sku: 'ABA-SOP-LAK-RES',
      name: 'Sopa Instantánea Laky Sabor Res',
      slug: 'sopa-instantanea-laky-sabor-res',
      description: 'Sopa instantánea de fideos con sazonador de res.',
      categorySlug: 'abarrotes',
      basePrice: 4.00,
      stockUnitLabel: 'unidades',
      quantity: 60,
    },
    {
      sku: 'ABA-SOP-KOR',
      name: 'Sopa Coreana Picante (Ramen)',
      slug: 'sopa-coreana-picante-ramen',
      description: 'Ramen instantáneo estilo coreano ligeramente picante.',
      categorySlug: 'abarrotes',
      basePrice: 7.50,
      stockUnitLabel: 'unidades',
      quantity: 30,
    },

    // Pastas / Fideos
    {
      sku: 'ABA-PAS-ESP',
      name: 'Fideos Espagueti (Paquete 200g)',
      slug: 'fideos-espagueti-paquete-200g',
      description: 'Pasta de sémola de trigo tipo espagueti.',
      categorySlug: 'abarrotes',
      basePrice: 3.50,
      stockUnitLabel: 'paquetes',
      quantity: 20,
    },
    {
      sku: 'ABA-PAS-CAR',
      name: 'Fideos Caracol (Paquete 200g)',
      slug: 'fideos-caracol-paquete-200g',
      description: 'Pasta corta en forma de caracol para sopas o ensaladas.',
      categorySlug: 'abarrotes',
      basePrice: 3.50,
      stockUnitLabel: 'paquetes',
      quantity: 25,
    },
    {
      sku: 'ABA-PAS-COD',
      name: 'Fideos Coditos (Paquete 200g)',
      slug: 'fideos-coditos-paquete-200g',
      description: 'Pasta corta tipo codito ideal para ensaladas frías.',
      categorySlug: 'abarrotes',
      basePrice: 3.50,
      stockUnitLabel: 'paquetes',
      quantity: 30,
    },

    // Bebidas
    {
      sku: 'BEB-COC-600',
      name: 'Coca-Cola 600ml Desechable',
      slug: 'coca-cola-600ml-desechable',
      description: 'Refresco carbonatado Coca-Cola en botella desechable de 600ml.',
      categorySlug: 'bebidas',
      basePrice: 6.00,
      stockUnitLabel: 'botellas',
      quantity: 40,
    },
    {
      sku: 'BEB-AGU-PUR',
      name: 'Agua Pura Salvavidas 600ml',
      slug: 'agua-pura-salvavidas-600ml',
      description: 'Botella de agua purificada fresca de 600ml.',
      categorySlug: 'bebidas',
      basePrice: 4.00,
      stockUnitLabel: 'botellas',
      quantity: 50,
    },

    // Dulces y Golosinas
    {
      sku: 'DUL-BOM-SUR',
      name: 'Bombones Surtidos (Unidad)',
      slug: 'bombones-surtidos-unidad',
      description: 'Paletas y bombones surtidos de caramelo.',
      categorySlug: 'dulces',
      basePrice: 1.00,
      stockUnitLabel: 'unidades',
      quantity: 80,
    },
    {
      sku: 'DUL-GEL-POL',
      name: 'Gelatina en Polvo (Variedad de sabores)',
      slug: 'gelatina-en-polvo-variedad',
      description: 'Paquete de gelatina en polvo para preparar en casa.',
      categorySlug: 'dulces',
      basePrice: 3.00,
      stockUnitLabel: 'paquetes',
      quantity: 100,
    },
    {
      sku: 'DUL-ANG-MAL',
      name: 'Angelitos Malvaviscos (Paquete)',
      slug: 'angelitos-malvaviscos-paquete',
      description: 'Malvaviscos suaves y esponjosos tipo angelito.',
      categorySlug: 'dulces',
      basePrice: 2.50,
      stockUnitLabel: 'paquetes',
      quantity: 75,
    },

    // Salsas y Aderezos
    {
      sku: 'ABA-SAL-DUL',
      name: 'Salsa Dulce de Tomate (Ketchup 200g)',
      slug: 'salsa-dulce-tomate-ketchup-200g',
      description: 'Salsa de tomate tipo ketchup en presentación práctica.',
      categorySlug: 'abarrotes',
      basePrice: 5.50,
      stockUnitLabel: 'unidades',
      quantity: 25,
    },
    {
      sku: 'ABA-SAL-PIC',
      name: 'Salsa Picamás Verde (Frasco 185g)',
      slug: 'salsa-picamas-verde-frasco-185g',
      description: 'Clásica salsa picante verde Picamás, sabor tradicional.',
      categorySlug: 'abarrotes',
      basePrice: 6.50,
      stockUnitLabel: 'frascos',
      quantity: 12,
    },
    {
      sku: 'ABA-MAY-DOY',
      name: 'Mayonesa (Doypack 200g)',
      slug: 'mayonesa-doypack-200g',
      description: 'Mayonesa cremosa en empaque doypack.',
      categorySlug: 'abarrotes',
      basePrice: 7.00,
      stockUnitLabel: 'unidades',
      quantity: 15,
    },

    // Embutidos y Carnes
    {
      sku: 'EMB-MED-POL',
      name: 'Medallones de Pollo Empanizados (Unidad)',
      slug: 'medallones-de-pollo-empanizados-unidad',
      description: 'Medallón congelado empanizado listo para cocinar.',
      categorySlug: 'abarrotes',
      basePrice: 3.50,
      stockUnitLabel: 'unidades',
      quantity: 60,
    },
    {
      sku: 'EMB-TOR-CAR',
      name: 'Tortitas de Carne para Hamburguesa (Unidad)',
      slug: 'tortitas-de-carne-hamburguesa-unidad',
      description: 'Tortita de carne sazonada congelada para hamburguesa.',
      categorySlug: 'abarrotes',
      basePrice: 3.50,
      stockUnitLabel: 'unidades',
      quantity: 50,
    },
    {
      sku: 'EMB-JAM-TRA',
      name: 'Jamón Tradicional (Paquete 8 rebanadas)',
      slug: 'jamon-tradicional-paquete-8-rebanadas',
      description: 'Paquete de jamón cocido empacado al vacío.',
      categorySlug: 'abarrotes',
      basePrice: 12.00,
      stockUnitLabel: 'paquetes',
      quantity: 100,
    },
    {
      sku: 'EMB-SAL-PAQ',
      name: 'Salchicha Tradicional (Paquete 8u)',
      slug: 'salchicha-tradicional-paquete-8u',
      description: 'Salchichas cocidas empacadas al vacío.',
      categorySlug: 'abarrotes',
      basePrice: 12.00,
      stockUnitLabel: 'paquetes',
      quantity: 120,
    },
  ];

  let productsProcessed = 0;

  for (const item of resaleProductsData) {
    const catId = categoryMap.get(item.categorySlug) || categoryMap.get('abarrotes');

    const productRecord = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        stockUnitLabel: item.stockUnitLabel,
        categoryId: catId,
        origin: 'COMPRADO',
        tracksExpiration: false,
        isActive: true,
        isAvailable: true,
      },
      create: {
        sku: item.sku,
        name: item.name,
        slug: item.slug,
        description: item.description,
        basePrice: item.basePrice,
        stockUnitLabel: item.stockUnitLabel,
        categoryId: catId,
        origin: 'COMPRADO',
        tracksExpiration: false,
        isNew: false,
        isActive: true,
        isAvailable: true,
      },
    });

    // Inventario por sucursales
    for (const b of branches) {
      const isCentral = b.id === centralBranch.id;
      const targetQty = isCentral ? item.quantity : 0;

      await prisma.inventory.upsert({
        where: {
          productId_branchId: {
            productId: productRecord.id,
            branchId: b.id,
          },
        },
        update: {
          quantity: targetQty,
        },
        create: {
          productId: productRecord.id,
          branchId: b.id,
          quantity: targetQty,
          reserved: 0,
        },
      });

      // Crear lote de apertura si es la sucursal central
      if (isCentral && targetQty > 0) {
        // Verificar si ya existe lote de apertura
        const existingLot = await prisma.inventoryLot.findFirst({
          where: {
            productId: productRecord.id,
            branchId: b.id,
            sourceType: 'APERTURA',
          },
        });

        if (existingLot) {
          await prisma.inventoryLot.update({
            where: { id: existingLot.id },
            data: {
              initialQuantity: targetQty,
              availableQuantity: targetQty,
            },
          });
        } else {
          await prisma.inventoryLot.create({
            data: {
              productId: productRecord.id,
              branchId: b.id,
              sourceType: 'APERTURA',
              initialQuantity: targetQty,
              availableQuantity: targetQty,
            },
          });
        }
      }
    }
    productsProcessed++;
  }

  console.log(`✅ ${productsProcessed} Productos de Tienda / Reventa asegurados con stock en ${centralBranch.name}.`);

  console.log('\n====================================================');
  console.log('🎉 INVENTARIO ADICIONAL SEMBRADO CON ÉXITO');
  console.log('====================================================');
}

main()
  .catch(err => {
    console.error('❌ Error ejecutando siembra de inventario adicional:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
