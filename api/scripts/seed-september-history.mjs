import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// IDs identificados
const BRANCH_CENTRAL_ID = 1;     // Panaderia Buena Vista
const BRANCH_SECUNDARIA_ID = 33; // Panaderia Secundaria

const USER_ADMIN_ID = '39579283-0d8b-4a4c-96ce-4934b520e32c';     // Jhordy Xil (ADMIN)
const USER_BAKER_ID = '4ad725f8-d5a3-4b9f-a38d-1ee4440a4848';     // Carlos Morales (BAKER)
const USER_SECUNDARIA_ID = '989de1e7-e8ae-4006-bab6-1f770676afcf'; // Elena Ramírez (MANAGER)

// Días de septiembre 2026 (1 al 30)
// Domingos: 6, 13, 20, 27 (CERRADO - 0 registros)
const WORKING_DAYS_SEPTEMBER = [
  // Semana 1
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05',
  // Semana 2
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
  // Semana 3 (15 = Quincena / Día de la Independencia)
  '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19',
  // Semana 4
  '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26',
  // Semana 5 (30 = Quincena / Cierre de Mes)
  '2026-09-28', '2026-09-29', '2026-09-30'
];

// Factores de variación realista según día de la semana y eventos
function getDayFactor(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = d.getUTCDay(); // 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab

  let factor = 1.0;
  if (dayOfWeek === 1) factor = 0.93; // Lunes un poco más suave
  else if (dayOfWeek === 2) factor = 0.96; // Martes regular
  else if (dayOfWeek === 3) factor = 0.98; // Miércoles regular
  else if (dayOfWeek === 4) factor = 1.01; // Jueves estable
  else if (dayOfWeek === 5) factor = 1.10; // Viernes pico
  else if (dayOfWeek === 6) factor = 1.15; // Sábado fin de semana

  // Picos de quincena y fin de mes
  if (dateStr === '2026-09-15') factor = 1.20; // Quincena + festivo patrio
  if (dateStr === '2026-09-30') factor = 1.18; // Quincena cierre de mes

  // Variación pseudoaleatoria sutil fija por fecha para realismo orgánico
  const dayNum = parseInt(dateStr.slice(-2), 10);
  const microVariation = ((dayNum * 17) % 7 - 3) * 0.015; // entre -4.5% y +4.5%

  return Math.max(0.85, Math.min(1.25, factor + microVariation));
}

// Configuración base de demanda promedio por producto
const PRODUCT_CONFIGS = [
  // 1. Pan Francés (Q0.50) - Pilar de volumen
  { id: 54, name: 'Pan Francés Tradicional', price: 0.50, unitsPerTray: 36, recipeId: 35, baseCentral: 750, baseSecundaria: 420, wasteProb: 0.95, baseWaste: 5 },
  // 2. Pan Dulce Tradicional
  { id: 55, name: 'Pan Dulce Pequeño', price: 0.50, unitsPerTray: 40, recipeId: 38, baseCentral: 180, baseSecundaria: 100, wasteProb: 0.5, baseWaste: 2 },
  { id: 56, name: 'Pan Dulce Grande', price: 1.25, unitsPerTray: 20, recipeId: 36, baseCentral: 60, baseSecundaria: 32, wasteProb: 0.4, baseWaste: 1 },
  { id: 69, name: 'Pasitas', price: 0.75, unitsPerTray: 30, recipeId: 49, baseCentral: 40, baseSecundaria: 20, wasteProb: 0.3, baseWaste: 1 },
  { id: 68, name: 'Campechana', price: 1.25, unitsPerTray: 20, recipeId: 48, baseCentral: 40, baseSecundaria: 20, wasteProb: 0.4, baseWaste: 1 },
  // 3. Galletas
  { id: 58, name: 'Champurrada Pequeña', price: 0.50, unitsPerTray: 24, recipeId: 40, baseCentral: 80, baseSecundaria: 45, wasteProb: 0.7, baseWaste: 2 },
  { id: 59, name: 'Champurrada Grande', price: 1.25, unitsPerTray: 15, recipeId: 39, baseCentral: 30, baseSecundaria: 16, wasteProb: 0.5, baseWaste: 1 },
  { id: 57, name: 'Pan Galleta', price: 1.25, unitsPerTray: 20, recipeId: 41, baseCentral: 30, baseSecundaria: 16, wasteProb: 0.4, baseWaste: 1 },
  { id: 64, name: 'Polvorosa Tradicional', price: 1.25, unitsPerTray: 15, recipeId: 42, baseCentral: 20, baseSecundaria: 12, wasteProb: 0.3, baseWaste: 1 },
  // 4. Repostería y Donas
  { id: 60, name: 'Cubilete de Vainilla', price: 2.00, unitsPerTray: 30, recipeId: 43, baseCentral: 15, baseSecundaria: 9, wasteProb: 0.3, baseWaste: 1 },
  { id: 61, name: 'Cubilete de Banano', price: 2.00, unitsPerTray: 30, recipeId: 44, baseCentral: 15, baseSecundaria: 9, wasteProb: 0.3, baseWaste: 1 },
  { id: 62, name: 'Empanada de Piña', price: 2.50, unitsPerTray: 16, recipeId: 37, baseCentral: 8, baseSecundaria: 5, wasteProb: 0.2, baseWaste: 1 },
  { id: 63, name: 'Empanada de Manjar', price: 2.50, unitsPerTray: 16, recipeId: 45, baseCentral: 8, baseSecundaria: 5, wasteProb: 0.2, baseWaste: 1 },
  { id: 70, name: 'Cortada de Fresa', price: 2.50, unitsPerTray: 14, recipeId: 46, baseCentral: 4, baseSecundaria: 2, wasteProb: 0.2, baseWaste: 1 },
  { id: 71, name: 'Cortada de Chocolate', price: 2.50, unitsPerTray: 14, recipeId: 47, baseCentral: 4, baseSecundaria: 2, wasteProb: 0.2, baseWaste: 1 },
  { id: 65, name: 'Dona Simple Glaseada', price: 2.50, unitsPerTray: 24, recipeId: 50, baseCentral: 8, baseSecundaria: 4, wasteProb: 0.3, baseWaste: 1 },
  { id: 66, name: 'Dona Rellena de Manjar', price: 4.00, unitsPerTray: 24, recipeId: 51, baseCentral: 3, baseSecundaria: 1, wasteProb: 0.1, baseWaste: 1 },
  { id: 67, name: 'Dona Rellena de Fresa', price: 4.00, unitsPerTray: 24, recipeId: 52, baseCentral: 3, baseSecundaria: 1, wasteProb: 0.1, baseWaste: 1 }
];

async function main() {
  console.log('================================================================');
  console.log('🥖 INICIANDO CARGA HISTÓRICA DE SEPTIEMBRE 2026 (OPTIMIZADA)');
  console.log('================================================================');
  console.log(`📍 Días a procesar: ${WORKING_DAYS_SEPTEMBER.length} días (Lunes a Sábado estrictos)`);
  console.log('📍 Domingos excluidos: 6, 13, 20 y 27 de septiembre (Cerrado)');
  console.log('📍 Obrador único de horneado: Panaderia Buena Vista (Central)');
  console.log('📍 Traslado matutino a Sucursal Secundaria: 06:30 AM');
  console.log('📍 Cierres diarios auditados por:');
  console.log('    - Central: Jhordy Xil (ADMIN)');
  console.log('    - Secundaria: Elena Ramírez (MANAGER)');

  // 1. Limpieza de datos previos de septiembre 2026 para garantizar idempotencia
  console.log('\n🧹 Limpiando registros previos de septiembre 2026...');
  const cleanupStart = new Date('2026-08-31T00:00:00.000Z');
  const cleanupEnd = new Date('2026-10-01T23:59:59.999Z');

  await prisma.dailyCloseItem.deleteMany({
    where: {
      dailyClose: {
        closeDate: { gte: cleanupStart, lte: cleanupEnd }
      }
    }
  });

  await prisma.stockMovement.deleteMany({
    where: {
      createdAt: { gte: cleanupStart, lte: cleanupEnd }
    }
  });

  await prisma.dailyClose.deleteMany({
    where: {
      closeDate: { gte: cleanupStart, lte: cleanupEnd }
    }
  });

  await prisma.productionLog.deleteMany({
    where: {
      createdAt: { gte: cleanupStart, lte: cleanupEnd }
    }
  });
  console.log('✅ Base de datos limpia de registros de septiembre.');

  // 2. Preparar todas las colecciones para inserción masiva en memoria
  console.log('\n⚙️ Calculando datos de producción, traslados, ventas y mermas...');
  const productionLogsData = [];
  const stockMovementsData = [];
  const dailyClosesData = []; // [{ closeInfo, items: [] }]

  let totalRevenueCentral = 0;
  let totalRevenueSecundaria = 0;
  let totalBreadBaked = 0;
  let totalBreadSoldCentral = 0;
  let totalBreadSoldSecundaria = 0;
  let totalBreadTransferred = 0;

  for (const dateStr of WORKING_DAYS_SEPTEMBER) {
    const factor = getDayFactor(dateStr);
    let dayRevenueCentral = 0;
    let dayRevenueSecundaria = 0;

    // Horarios locales de Guatemala (UTC-6)
    // Se fijan en rango de día (06:00 a 17:00 local = 12:00 a 23:00 UTC)
    // para que coincidan EXACTAMENTE con el mismo día tanto en UTC como en hora local
    const bakeTime = new Date(`${dateStr}T06:00:00-06:00`);     // 06:00 AM local (12:00 UTC)
    const prodTime = new Date(`${dateStr}T06:15:00-06:00`);     // 06:15 AM local (12:15 UTC)
    const transferTime = new Date(`${dateStr}T06:30:00-06:00`); // 06:30 AM local (12:30 UTC)
    const salesTime = new Date(`${dateStr}T15:00:00-06:00`);    // 03:00 PM local (21:00 UTC)
    const wasteTime = new Date(`${dateStr}T15:30:00-06:00`);    // 03:30 PM local (21:30 UTC)
    const closeTime = new Date(`${dateStr}T17:00:00-06:00`);    // 05:00 PM local (23:00 UTC)
    const closeDate = new Date(`${dateStr}T12:00:00.000Z`);     // Mediodía UTC para @db.Date seguro

    const centralItems = [];
    const secundariaItems = [];

    for (const prod of PRODUCT_CONFIGS) {
      const soldCentral = Math.max(1, Math.round(prod.baseCentral * factor));
      const soldSecundaria = Math.max(1, Math.round(prod.baseSecundaria * factor));

      dayRevenueCentral += soldCentral * prod.price;
      dayRevenueSecundaria += soldSecundaria * prod.price;

      const hasWaste = Math.random() < prod.wasteProb;
      const wasteCentral = hasWaste ? Math.max(1, Math.round(prod.baseWaste * (factor >= 1.1 ? 1.5 : 1))) : 0;
      const wasteSecundaria = hasWaste && prod.baseWaste > 1 ? 1 : 0;

      const surplusCentral = Math.max(1, Math.round(soldCentral * 0.045));
      const surplusSecundaria = Math.max(1, Math.round(soldSecundaria * 0.045));

      const neededSecundaria = soldSecundaria + surplusSecundaria + wasteSecundaria;
      const neededCentral = soldCentral + surplusCentral + wasteCentral;

      const totalUnitsNeeded = neededCentral + neededSecundaria;
      const trays = Math.ceil(totalUnitsNeeded / prod.unitsPerTray);
      const unitsProduced = trays * prod.unitsPerTray;

      const extraProduced = unitsProduced - totalUnitsNeeded;
      const finalSurplusCentral = surplusCentral + extraProduced;

      // A. Horneado en obrador central
      productionLogsData.push({
        recipeId: prod.recipeId,
        branchId: BRANCH_CENTRAL_ID,
        userId: USER_BAKER_ID,
        traysProduced: trays,
        unitsProduced: unitsProduced,
        createdAt: bakeTime,
        note: `Amasijo matutino en obrador central (${trays} latas de ${prod.unitsPerTray} uds)`
      });

      stockMovementsData.push({
        productId: prod.id,
        toBranchId: BRANCH_CENTRAL_ID,
        type: 'PRODUCCION',
        quantity: unitsProduced,
        userId: USER_BAKER_ID,
        createdAt: prodTime,
        note: `Entrada de pan caliente horneado en obrador central`
      });

      totalBreadBaked += unitsProduced;

      // B. Traslado matutino a Secundaria
      stockMovementsData.push({
        productId: prod.id,
        fromBranchId: BRANCH_CENTRAL_ID,
        toBranchId: BRANCH_SECUNDARIA_ID,
        type: 'TRANSFERENCIA',
        quantity: neededSecundaria,
        userId: USER_BAKER_ID,
        createdAt: transferTime,
        note: `Traslado matutino de pan caliente a Sucursal Secundaria`
      });
      totalBreadTransferred += neededSecundaria;

      // C. Ventas Central
      stockMovementsData.push({
        productId: prod.id,
        fromBranchId: BRANCH_CENTRAL_ID,
        type: 'VENTA',
        quantity: soldCentral,
        userId: USER_ADMIN_ID,
        createdAt: salesTime,
        note: `Despacho de mostrador en Buena Vista`
      });
      totalBreadSoldCentral += soldCentral;

      // D. Ventas Secundaria
      stockMovementsData.push({
        productId: prod.id,
        fromBranchId: BRANCH_SECUNDARIA_ID,
        type: 'VENTA',
        quantity: soldSecundaria,
        userId: USER_SECUNDARIA_ID,
        createdAt: salesTime,
        note: `Despacho de mostrador en Sucursal Secundaria`
      });
      totalBreadSoldSecundaria += soldSecundaria;

      // E. Mermas
      if (wasteCentral > 0) {
        stockMovementsData.push({
          productId: prod.id,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'MERMA',
          quantity: wasteCentral,
          userId: USER_ADMIN_ID,
          createdAt: wasteTime,
          note: `Descarte por tostado excesivo o puntas quebradas`
        });
      }

      if (wasteSecundaria > 0) {
        stockMovementsData.push({
          productId: prod.id,
          fromBranchId: BRANCH_SECUNDARIA_ID,
          type: 'MERMA',
          quantity: wasteSecundaria,
          userId: USER_SECUNDARIA_ID,
          createdAt: wasteTime,
          note: `Descarte por daño durante transporte o despacho`
        });
      }

      // Ítems de cierre diario
      centralItems.push({
        productId: prod.id,
        productName: prod.name,
        systemQty: finalSurplusCentral,
        reservedQty: 0,
        countedQty: finalSurplusCentral,
        wasteQty: wasteCentral,
        soldQty: soldCentral,
        surplusQty: finalSurplusCentral
      });

      secundariaItems.push({
        productId: prod.id,
        productName: prod.name,
        systemQty: surplusSecundaria,
        reservedQty: 0,
        countedQty: surplusSecundaria,
        wasteQty: wasteSecundaria,
        soldQty: soldSecundaria,
        surplusQty: surplusSecundaria
      });
    }

    dailyClosesData.push({
      close: {
        branchId: BRANCH_CENTRAL_ID,
        userId: USER_ADMIN_ID,
        closeDate: closeDate,
        snapshotAt: closeTime,
        createdAt: closeTime,
        note: `Cierre operativo de jornada conciliado por Administrador Jhordy Xil`
      },
      items: centralItems
    });

    dailyClosesData.push({
      close: {
        branchId: BRANCH_SECUNDARIA_ID,
        userId: USER_SECUNDARIA_ID,
        closeDate: closeDate,
        snapshotAt: closeTime,
        createdAt: closeTime,
        note: `Cierre de sucursal verificado y conciliado por Encargada Elena Ramírez`
      },
      items: secundariaItems
    });

    totalRevenueCentral += dayRevenueCentral;
    totalRevenueSecundaria += dayRevenueSecundaria;
  }

  // 3. Inserciones masivas rápidas (Bulk inserts)
  console.log(`\n🚀 Insertando ${productionLogsData.length} registros de ProductionLog en bloque...`);
  await prisma.productionLog.createMany({
    data: productionLogsData
  });
  console.log('✅ ProductionLogs insertados exitosamente.');

  console.log(`🚀 Insertando ${stockMovementsData.length} movimientos de inventario en bloque...`);
  await prisma.stockMovement.createMany({
    data: stockMovementsData
  });
  console.log('✅ StockMovements insertados exitosamente.');

  console.log(`🚀 Insertando ${dailyClosesData.length} Cierres Diarios y sus ítems conciliados...`);
  for (const entry of dailyClosesData) {
    const createdClose = await prisma.dailyClose.create({
      data: entry.close
    });

    const itemsWithCloseId = entry.items.map(it => ({
      ...it,
      dailyCloseId: createdClose.id
    }));

    await prisma.dailyCloseItem.createMany({
      data: itemsWithCloseId
    });
  }
  console.log('✅ Cierres diarios e ítems insertados exitosamente.');

  // 4. Lotes de Caducidad de Muestra para Productos de Reventa
  console.log('\n📦 Sincronizando lotes de muestra para productos de reventa (< 30 días)...');
  const now = new Date();
  const sampleResaleSkus = [
    { sku: 'ABA-LECH-PAS', name: 'Leche Pasteurizada 1L', days: 2, qty: 6 },
    { sku: 'ABA-JAM-PAV', name: 'Jamón de Pavo 250g', days: 5, qty: 10 },
    { sku: 'ABA-QUE-CRE', name: 'Queso Crema 8oz', days: 6, qty: 8 },
    { sku: 'ABA-JUG-NAR', name: 'Jugo de Naranja 1L', days: 18, qty: 15 },
    { sku: 'ABA-HUE-GRA', name: 'Huevo Fresco de Granja', days: 24, qty: 60 }
  ];

  for (const s of sampleResaleSkus) {
    const prod = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: s.sku },
          { name: { contains: s.name.split(' ')[0] } }
        ]
      }
    });

    if (prod) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { tracksExpiration: true, expirationAlertDays: [30, 15, 3] }
      });

      const expiresAt = new Date(now.getTime() + s.days * 24 * 60 * 60 * 1000);
      const alertAt = new Date(now.getTime() + Math.max(1, s.days - 3) * 24 * 60 * 60 * 1000);

      await prisma.inventoryLot.deleteMany({
        where: { productId: prod.id, branchId: BRANCH_CENTRAL_ID }
      });

      await prisma.inventoryLot.create({
        data: {
          productId: prod.id,
          branchId: BRANCH_CENTRAL_ID,
          sourceType: 'COMPRA',
          initialQuantity: s.qty,
          availableQuantity: s.qty,
          expiresAt: expiresAt,
          alertAt: alertAt,
          createdAt: now
        }
      });
      console.log(`  ✓ Lote creado para ${prod.name}: vence en ${s.days} días (${s.qty} uds)`);
    }
  }

  // 5. Métricas y Resumen Final
  const avgRevenueCentral = totalRevenueCentral / WORKING_DAYS_SEPTEMBER.length;
  const avgRevenueSecundaria = totalRevenueSecundaria / WORKING_DAYS_SEPTEMBER.length;

  console.log('\n================================================================');
  console.log('🎉 RESUMEN DE LA CARGA HISTÓRICA DE SEPTIEMBRE 2026:');
  console.log('================================================================');
  console.log(`📅 Días procesados: ${WORKING_DAYS_SEPTEMBER.length} días (Lunes a Sábado)`);
  console.log(`🥖 Total panes horneados en Central: ${totalBreadBaked.toLocaleString()} unidades`);
  console.log(`🚚 Total panes trasladados a Secundaria: ${totalBreadTransferred.toLocaleString()} unidades`);
  console.log(`🏪 Total panes vendidos en Central: ${totalBreadSoldCentral.toLocaleString()} unidades`);
  console.log(`🏪 Total panes vendidos en Secundaria: ${totalBreadSoldSecundaria.toLocaleString()} unidades`);
  console.log('----------------------------------------------------------------');
  console.log(`💰 Venta total mensual Central (Buena Vista): Q${totalRevenueCentral.toFixed(2)}`);
  console.log(`📊 Promedio diario Central: Q${avgRevenueCentral.toFixed(2)} / día (Meta: ~Q900)`);
  console.log('----------------------------------------------------------------');
  console.log(`💰 Venta total mensual Secundaria: Q${totalRevenueSecundaria.toFixed(2)}`);
  console.log(`📊 Promedio diario Secundaria: Q${avgRevenueSecundaria.toFixed(2)} / día (Meta: ~Q500)`);
  console.log('----------------------------------------------------------------');
  console.log(`📝 Cierres diarios registrados: ${dailyClosesData.length} (${WORKING_DAYS_SEPTEMBER.length} en Central por Jhordy Xil, ${WORKING_DAYS_SEPTEMBER.length} en Secundaria por Elena Ramírez)`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando carga histórica de septiembre:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
