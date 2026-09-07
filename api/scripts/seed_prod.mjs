import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando siembra de datos maestros de producción...');

  // 1. Obtener sucursales activas
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  console.log(`📍 Sucursales detectadas: ${branches.map(b => `${b.name} (id: ${b.id})`).join(', ')}`);
  if (branches.length === 0) {
    throw new Error('No se encontraron sucursales activas.');
  }

  // 2. Limpieza de materias primas de prueba previas (si existen y no tienen dependencias)
  await prisma.rawMaterialInventory.deleteMany({
    where: { rawMaterial: { name: { contains: 'Test' } } }
  }).catch(() => {});
  await prisma.recipeIngredient.deleteMany({
    where: { rawMaterial: { name: { contains: 'Test' } } }
  }).catch(() => {});
  await prisma.rawMaterial.deleteMany({
    where: { name: { contains: 'Test' } }
  }).catch(() => {});

  // 3. Categorías maestras
  const categoriesData = [
    { name: 'Pan', slug: 'pan', description: 'Pan tradicional salado y de agua' },
    { name: 'Pan Dulce', slug: 'pan-dulce', description: 'Pan dulce tradicional guatemalteco horneado diariamente' },
    { name: 'Pasteles', slug: 'pasteles', description: 'Repostería fina, cubiletes, empanadas y cortadas' },
    { name: 'Galletas', slug: 'galletas', description: 'Champurradas, polvorosas y pan galleta artesanal' },
    { name: 'Donas', slug: 'donas', description: 'Donas tradicionales simples y rellenas' },
    { name: 'Bebidas', slug: 'bebidas', description: 'Refrescos fríos, jugos y café caliente' },
    { name: 'Abarrotes', slug: 'abarrotes', description: 'Lácteos, embutidos y productos de consumo diario' },
  ];

  const categoryMap = new Map();
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, isActive: true },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✅ ${categoriesData.length} Categorías aseguradas.`);

  // 4. Materias Primas (RawMaterial)
  const rawMaterialsData = [
    { name: 'Harina Dura', baseUnit: 'LB', costPerUnit: 2.80, minStock: 200 },
    { name: 'Harina Suave', baseUnit: 'LB', costPerUnit: 2.70, minStock: 200 },
    { name: 'Azúcar Blanca', baseUnit: 'LB', costPerUnit: 3.50, minStock: 20 },
    { name: 'Levadura', baseUnit: 'LB', costPerUnit: 14.00, minStock: 10 },
    { name: 'Huevos', baseUnit: 'UNIT', costPerUnit: 1.10, minStock: 60 },
    { name: 'Manteca Vegetal', baseUnit: 'LB', costPerUnit: 8.50, minStock: 25 },
    { name: 'Margarina', baseUnit: 'LB', costPerUnit: 9.00, minStock: 25 },
    { name: 'Polvo de Hornear (Royal)', baseUnit: 'LB', costPerUnit: 12.00, minStock: 10 },
    { name: 'Sal', baseUnit: 'LB', costPerUnit: 1.00, minStock: 15 },
    { name: 'Esencia de Vainilla', baseUnit: 'ML', costPerUnit: 0.035, minStock: 1000 },
    { name: 'Esencia de Ponche de Frutas', baseUnit: 'ML', costPerUnit: 0.035, minStock: 1000 },
    { name: 'Solución de Yemas', baseUnit: 'ML', costPerUnit: 0.040, minStock: 1000 },
    { name: 'Molde de Cubilete', baseUnit: 'UNIT', costPerUnit: 0.10, minStock: 200 },
    { name: 'Manga de Jalea de Piña', baseUnit: 'UNIT', costPerUnit: 18.00, minStock: 2 },
    { name: 'Manga de Jalea de Fresa', baseUnit: 'UNIT', costPerUnit: 18.00, minStock: 2 },
    { name: 'Manga de Manjar', baseUnit: 'UNIT', costPerUnit: 20.00, minStock: 2 },
    { name: 'Cocoa Oscura', baseUnit: 'LB', costPerUnit: 22.00, minStock: 1 },
    { name: 'Bicarbonato de Sodio', baseUnit: 'UNIT', costPerUnit: 1.50, minStock: 10 },
  ];

  const rawMaterialMap = new Map();
  for (const raw of rawMaterialsData) {
    const record = await prisma.rawMaterial.upsert({
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
    rawMaterialMap.set(raw.name, record.id);

    // Inventario de materia prima por sucursal
    for (const b of branches) {
      await prisma.rawMaterialInventory.upsert({
        where: {
          rawMaterialId_branchId: {
            rawMaterialId: record.id,
            branchId: b.id,
          },
        },
        update: {},
        create: {
          rawMaterialId: record.id,
          branchId: b.id,
          quantity: 0,
        },
      });
    }
  }
  console.log(`✅ ${rawMaterialsData.length} Materias Primas e Inventarios por sucursal asegurados.`);

  // 5. Productos Terminados (Producidos) y de Reventa (Comprados)
  const productsData = [
    // ── Panes Producidos ──
    {
      sku: 'PAN-FRA-001',
      name: 'Pan Francés Tradicional',
      slug: 'pan-frances-tradicional',
      description: 'Pan francés artesanal crujiente por fuera y suave por dentro, horneado en 6 tiras.',
      categorySlug: 'pan',
      basePrice: 0.50,
      comboQuantity: 3,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 36,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
      presentations: [
        { name: 'Tira entera (6 panes)', unitsInStock: 6, price: 2.50, isDefault: true, isForSale: true, isForProduction: true },
        { name: 'Media tira (3 panes)', unitsInStock: 3, price: 1.25, isDefault: false, isForSale: true, isForProduction: false },
        { name: 'Unidad suelta (1 pan)', unitsInStock: 1, price: 0.50, isDefault: false, isForSale: true, isForProduction: false },
      ],
    },
    {
      sku: 'PAN-DUL-PEQ',
      name: 'Pan Dulce Pequeño',
      slug: 'pan-dulce-pequeno',
      description: 'Variedad de pan dulce tradicional en formato pequeño (conchitas, gusanos).',
      categorySlug: 'pan-dulce',
      basePrice: 0.50,
      comboQuantity: 3,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 40,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
      presentations: [
        { name: 'Combo Tradicional (3 panes)', unitsInStock: 3, price: 1.25, isDefault: true, isForSale: true, isForProduction: false },
        { name: 'Unidad (1 pan)', unitsInStock: 1, price: 0.50, isDefault: false, isForSale: true, isForProduction: false },
      ],
    },
    {
      sku: 'PAN-DUL-GRA',
      name: 'Pan Dulce Grande',
      slug: 'pan-dulce-grande',
      description: 'Pan dulce tradicional de tamaño grande (conchas, cachitos azucarados).',
      categorySlug: 'pan-dulce',
      basePrice: 1.25,
      comboQuantity: 1,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 20,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
      presentations: [
        { name: 'Unidad (1 pan)', unitsInStock: 1, price: 1.25, isDefault: true, isForSale: true, isForProduction: false },
      ],
    },
    {
      sku: 'PAN-GAL-001',
      name: 'Pan Galleta',
      slug: 'pan-galleta',
      description: 'Pan tradicional con textura de galleta tostada y toque de manteca y azúcar.',
      categorySlug: 'galletas',
      basePrice: 1.25,
      comboQuantity: 1,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 20,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'CHA-PEQ-001',
      name: 'Champurrada Pequeña',
      slug: 'champurrada-pequena',
      description: 'Tradicional champurrada guatemalteca tostada con ajonjolí, tamaño pequeño.',
      categorySlug: 'galletas',
      basePrice: 0.50,
      comboQuantity: 3,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 24,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
      presentations: [
        { name: 'Combo (3 unidades)', unitsInStock: 3, price: 1.25, isDefault: true, isForSale: true, isForProduction: false },
        { name: 'Unidad', unitsInStock: 1, price: 0.50, isDefault: false, isForSale: true, isForProduction: false },
      ],
    },
    {
      sku: 'CHA-GRA-001',
      name: 'Champurrada Grande',
      slug: 'champurrada-grande',
      description: 'Champurrada grande tostada y crujiente, ideal para acompañar con café.',
      categorySlug: 'galletas',
      basePrice: 1.25,
      comboQuantity: 1,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 15,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'CUB-VAI-001',
      name: 'Cubilete de Vainilla',
      slug: 'cubilete-de-vainilla',
      description: 'Esponjoso cubilete tradicional sabor a vainilla horneado en molde.',
      categorySlug: 'pasteles',
      basePrice: 2.00,
      stockUnitLabel: 'piezas',
      unitsPerTray: 30,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'CUB-BAN-001',
      name: 'Cubilete de Banano',
      slug: 'cubilete-de-banano',
      description: 'Delicioso cubilete artesanal con sabor natural a banano maduro.',
      categorySlug: 'pasteles',
      basePrice: 2.00,
      stockUnitLabel: 'piezas',
      unitsPerTray: 30,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'EMP-PIN-001',
      name: 'Empanada de Piña',
      slug: 'empanada-de-pina',
      description: 'Empanada dulce rellena de jalea de piña natural con orilla repulgue.',
      categorySlug: 'pasteles',
      basePrice: 2.50,
      stockUnitLabel: 'piezas',
      unitsPerTray: 16,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'EMP-MAN-001',
      name: 'Empanada de Manjar',
      slug: 'empanada-de-manjar',
      description: 'Empanada tradicional rellena de suave manjar de leche.',
      categorySlug: 'pasteles',
      basePrice: 2.50,
      stockUnitLabel: 'piezas',
      unitsPerTray: 16,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'POL-001',
      name: 'Polvorosa Tradicional',
      slug: 'polvorosa-tradicional',
      description: 'Polvorosa azucarada que se deshace al paladar.',
      categorySlug: 'galletas',
      basePrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 15,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'DON-SIM-001',
      name: 'Dona Simple Glaseada',
      slug: 'dona-simple-glaseada',
      description: 'Dona esponjosa espolvoreada con azúcar o ligero glaseado.',
      categorySlug: 'donas',
      basePrice: 2.50,
      stockUnitLabel: 'piezas',
      unitsPerTray: 24,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'DON-REL-MAN',
      name: 'Dona Rellena de Manjar',
      slug: 'dona-rellena-de-manjar',
      description: 'Dona rellena con abundante manjar cremoso y azúcar glass.',
      categorySlug: 'donas',
      basePrice: 4.00,
      stockUnitLabel: 'piezas',
      unitsPerTray: 24,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'DON-REL-FRE',
      name: 'Dona Rellena de Fresa',
      slug: 'dona-rellena-de-fresa',
      description: 'Dona rellena de jalea de fresa dulce y cobertura decorativa.',
      categorySlug: 'donas',
      basePrice: 4.00,
      stockUnitLabel: 'piezas',
      unitsPerTray: 24,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'CAM-001',
      name: 'Campechana',
      slug: 'campechana',
      description: 'Pan dulce hojaldrado con cubierta caramelizada crujiente.',
      categorySlug: 'pan-dulce',
      basePrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 20,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'PAS-001',
      name: 'Pasitas',
      slug: 'pasitas',
      description: 'Panecitos dulces horneados con uvas pasas seleccionadas.',
      categorySlug: 'pan-dulce',
      basePrice: 0.50,
      comboQuantity: 3,
      comboPrice: 1.25,
      stockUnitLabel: 'piezas',
      unitsPerTray: 30,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
      presentations: [
        { name: 'Combo (3 unidades)', unitsInStock: 3, price: 1.25, isDefault: true, isForSale: true, isForProduction: false },
        { name: 'Unidad', unitsInStock: 1, price: 0.50, isDefault: false, isForSale: true, isForProduction: false },
      ],
    },
    {
      sku: 'COR-FRE-001',
      name: 'Cortada de Fresa',
      slug: 'cortada-de-fresa',
      description: 'Pastelito cortado con mermelada de fresa y azúcar impalpable.',
      categorySlug: 'pasteles',
      basePrice: 2.50,
      stockUnitLabel: 'piezas',
      unitsPerTray: 14,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },
    {
      sku: 'COR-CHO-001',
      name: 'Cortada de Chocolate',
      slug: 'cortada-de-chocolate',
      description: 'Pastelito cortado con cacao oscuro y textura suave.',
      categorySlug: 'pasteles',
      basePrice: 2.50,
      stockUnitLabel: 'piezas',
      unitsPerTray: 14,
      origin: 'PRODUCIDO',
      tracksExpiration: false,
    },

    // ── Productos de Reventa (Abarrotes / Bebidas) ──
    {
      sku: 'BEB-COC-600',
      name: 'Coca-Cola 600ml Desechable',
      slug: 'coca-cola-600ml',
      description: 'Bebida gaseosa Coca-Cola en botella PET de 600ml bien fría.',
      categorySlug: 'bebidas',
      basePrice: 6.00,
      stockUnitLabel: 'unidades',
      origin: 'COMPRADO',
      tracksExpiration: false,
    },
    {
      sku: 'BEB-JUG-1L',
      name: 'Jugo de Naranja 1L',
      slug: 'jugo-de-naranja-1l',
      description: 'Jugo de naranja pasteurizado en presentación de 1 litro.',
      categorySlug: 'bebidas',
      basePrice: 12.00,
      stockUnitLabel: 'unidades',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [7, 3],
    },
    {
      sku: 'LAC-QUE-8OZ',
      name: 'Queso Crema 8oz',
      slug: 'queso-crema-8oz',
      description: 'Queso crema para untar en presentación de 8 onzas.',
      categorySlug: 'abarrotes',
      basePrice: 15.00,
      stockUnitLabel: 'unidades',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [5, 2],
    },
    {
      sku: 'ABA-GAL-SOD',
      name: 'Galletas Soda / Can-Can',
      slug: 'galletas-soda-can-can',
      description: 'Paquete de galletas saladas tipo soda para acompañar.',
      categorySlug: 'galletas',
      basePrice: 2.50,
      stockUnitLabel: 'paquetes',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [30, 15],
    },
    {
      sku: 'ABA-SOP-MAR',
      name: 'Sopa Instantánea Maruchan Vaso 64g',
      slug: 'sopa-instantanea-maruchan',
      description: 'Sopa instantánea de fideos en vaso para preparación rápida.',
      categorySlug: 'abarrotes',
      basePrice: 5.00,
      stockUnitLabel: 'vasos',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [30, 15],
    },
    {
      sku: 'ABA-HUE-UNI',
      name: 'Huevo Fresco de Granja (Unidad)',
      slug: 'huevo-fresco-granja',
      description: 'Huevo fresco blanco de granja por unidad.',
      categorySlug: 'abarrotes',
      basePrice: 1.50,
      stockUnitLabel: 'unidades',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [7, 3],
    },
    {
      sku: 'EMB-SAL-PAQ',
      name: 'Salchicha Tradicional (Paquete 8u)',
      slug: 'salchicha-tradicional-paquete',
      description: 'Paquete de salchichas cocidas refrigeradas de 8 unidades.',
      categorySlug: 'abarrotes',
      basePrice: 12.00,
      stockUnitLabel: 'paquetes',
      origin: 'COMPRADO',
      tracksExpiration: true,
      expirationAlertDays: [5, 2],
    },
    {
      sku: 'BEB-CAF-8OZ',
      name: 'Café Caliente 8oz para Llevar',
      slug: 'cafe-caliente-8oz',
      description: 'Café de grano recién preparado servido caliente en vaso de 8oz.',
      categorySlug: 'bebidas',
      basePrice: 5.00,
      stockUnitLabel: 'vasos',
      origin: 'COMPRADO',
      tracksExpiration: false,
    },
  ];

  const productMap = new Map();
  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría ${prod.categorySlug} no encontrada para el producto ${prod.name}`);
    }

    const productRecord = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        categoryId,
        basePrice: prod.basePrice,
        comboQuantity: prod.comboQuantity || null,
        comboPrice: prod.comboPrice || null,
        stockUnitLabel: prod.stockUnitLabel,
        unitsPerTray: prod.unitsPerTray || null,
        origin: prod.origin,
        tracksExpiration: prod.tracksExpiration || false,
        expirationAlertDays: prod.expirationAlertDays || [3],
        isActive: true,
        isAvailable: true,
      },
      create: {
        sku: prod.sku,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        categoryId,
        basePrice: prod.basePrice,
        comboQuantity: prod.comboQuantity || null,
        comboPrice: prod.comboPrice || null,
        stockUnitLabel: prod.stockUnitLabel,
        unitsPerTray: prod.unitsPerTray || null,
        origin: prod.origin,
        tracksExpiration: prod.tracksExpiration || false,
        expirationAlertDays: prod.expirationAlertDays || [3],
        isActive: true,
        isAvailable: true,
      },
    });
    productMap.set(prod.sku, productRecord.id);

    // Presentaciones si aplican
    if (prod.presentations && prod.presentations.length > 0) {
      for (const pres of prod.presentations) {
        await prisma.productPresentation.upsert({
          where: {
            productId_name: {
              productId: productRecord.id,
              name: pres.name,
            },
          },
          update: {
            unitsInStock: pres.unitsInStock,
            price: pres.price,
            isDefault: pres.isDefault,
            isForSale: pres.isForSale,
            isForProduction: pres.isForProduction || false,
            isActive: true,
          },
          create: {
            productId: productRecord.id,
            name: pres.name,
            unitsInStock: pres.unitsInStock,
            price: pres.price,
            isDefault: pres.isDefault,
            isForSale: pres.isForSale,
            isForProduction: pres.isForProduction || false,
            isActive: true,
          },
        });
      }
    }

    // Inventarios iniciales por sucursal
    for (const b of branches) {
      await prisma.inventory.upsert({
        where: {
          productId_branchId: {
            productId: productRecord.id,
            branchId: b.id,
          },
        },
        update: {},
        create: {
          productId: productRecord.id,
          branchId: b.id,
          quantity: 0,
          reserved: 0,
        },
      });
    }
  }
  console.log(`✅ ${productsData.length} Productos e Inventarios por sucursal asegurados.`);

  // 6. Recetas de Producción (Amasijos)
  const panFrancesId = productMap.get('PAN-FRA-001');
  const panDulceGrandeId = productMap.get('PAN-DUL-GRA');
  const empanadaPinaId = productMap.get('EMP-PIN-001');

  if (panFrancesId) {
    const recetaFrances = await prisma.recipe.upsert({
      where: {
        productId_name: {
          productId: panFrancesId,
          name: 'Amasijo Estándar de Francés (50 lb)',
        },
      },
      update: { standardTrays: 33, isActive: true },
      create: {
        productId: panFrancesId,
        name: 'Amasijo Estándar de Francés (50 lb)',
        standardTrays: 33,
        isActive: true,
      },
    });

    const ingredientesFrances = [
      { rawName: 'Harina Dura', qty: 50 },
      { rawName: 'Levadura', qty: 2 },
      { rawName: 'Azúcar Blanca', qty: 1 },
      { rawName: 'Sal', qty: 1 },
      { rawName: 'Manteca Vegetal', qty: 3 },
    ];

    for (const ing of ingredientesFrances) {
      const rawId = rawMaterialMap.get(ing.rawName);
      if (rawId) {
        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_rawMaterialId: {
              recipeId: recetaFrances.id,
              rawMaterialId: rawId,
            },
          },
          update: { quantity: ing.qty },
          create: {
            recipeId: recetaFrances.id,
            rawMaterialId: rawId,
            quantity: ing.qty,
          },
        });
      }
    }
    console.log('🥖 Receta de Pan Francés asegurada.');
  }

  if (panDulceGrandeId) {
    const recetaDulce = await prisma.recipe.upsert({
      where: {
        productId_name: {
          productId: panDulceGrandeId,
          name: 'Amasijo Estándar de Masa Dulce (50 lb)',
        },
      },
      update: { standardTrays: 15, isActive: true },
      create: {
        productId: panDulceGrandeId,
        name: 'Amasijo Estándar de Masa Dulce (50 lb)',
        standardTrays: 15,
        isActive: true,
      },
    });

    const ingredientesDulce = [
      { rawName: 'Harina Suave', qty: 50 },
      { rawName: 'Azúcar Blanca', qty: 15 },
      { rawName: 'Manteca Vegetal', qty: 8 },
      { rawName: 'Levadura', qty: 1.5 },
      { rawName: 'Huevos', qty: 25 },
      { rawName: 'Sal', qty: 0.5 },
      { rawName: 'Esencia de Vainilla', qty: 250 },
      { rawName: 'Solución de Yemas', qty: 100 },
    ];

    for (const ing of ingredientesDulce) {
      const rawId = rawMaterialMap.get(ing.rawName);
      if (rawId) {
        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_rawMaterialId: {
              recipeId: recetaDulce.id,
              rawMaterialId: rawId,
            },
          },
          update: { quantity: ing.qty },
          create: {
            recipeId: recetaDulce.id,
            rawMaterialId: rawId,
            quantity: ing.qty,
          },
        });
      }
    }
    console.log('🥐 Receta de Masa Dulce asegurada.');
  }

  if (empanadaPinaId) {
    const recetaDanesa = await prisma.recipe.upsert({
      where: {
        productId_name: {
          productId: empanadaPinaId,
          name: 'Amasijo Estándar de Masa Danesa (25 lb)',
        },
      },
      update: { standardTrays: 12, isActive: true },
      create: {
        productId: empanadaPinaId,
        name: 'Amasijo Estándar de Masa Danesa (25 lb)',
        standardTrays: 12,
        isActive: true,
      },
    });

    const ingredientesDanesa = [
      { rawName: 'Harina Suave', qty: 25 },
      { rawName: 'Margarina', qty: 8 },
      { rawName: 'Azúcar Blanca', qty: 5 },
      { rawName: 'Huevos', qty: 15 },
      { rawName: 'Levadura', qty: 0.5 },
      { rawName: 'Sal', qty: 0.25 },
    ];

    for (const ing of ingredientesDanesa) {
      const rawId = rawMaterialMap.get(ing.rawName);
      if (rawId) {
        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_rawMaterialId: {
              recipeId: recetaDanesa.id,
              rawMaterialId: rawId,
            },
          },
          update: { quantity: ing.qty },
          create: {
            recipeId: recetaDanesa.id,
            rawMaterialId: rawId,
            quantity: ing.qty,
          },
        });
      }
    }
    console.log('🥟 Receta de Masa Danesa asegurada.');
  }

  console.log('🎉 ¡Siembra de datos de producción completada con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
