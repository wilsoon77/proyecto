import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// IDs identificados en la base de datos
const BRANCH_CENTRAL_ID = 1;     // Panadería Buena Vista
const BRANCH_SECUNDARIA_ID = 33; // Panadería Secundaria

const USER_ADMIN_ID = '39579283-0d8b-4a4c-96ce-4934b520e32c';     // Jhordy Xil (ADMIN)
const USER_BAKER_ID = '4ad725f8-d5a3-4b9f-a38d-1ee4440a4848';     // Carlos Morales (BAKER)
const USER_SECUNDARIA_ID = '989de1e7-e8ae-4006-bab6-1f770676afcf'; // Elena Ramírez (MANAGER)

// Configuración base por producto
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
  console.log('CARGA OPERATIVA: 1, 2 Y 3 DE OCTUBRE DE 2026');
  console.log('================================================================');

  // Limpiar cualquier registro previo de octubre para idempotencia
  const cleanupStart = new Date('2026-10-01T00:00:00.000Z');
  const cleanupEnd = new Date('2026-10-04T00:00:00.000Z');

  await prisma.dailyCloseItem.deleteMany({
    where: {
      dailyClose: {
        closeDate: { gte: cleanupStart, lt: cleanupEnd }
      }
    }
  });

  await prisma.stockMovement.deleteMany({
    where: {
      createdAt: { gte: cleanupStart, lt: cleanupEnd }
    }
  });

  await prisma.dailyClose.deleteMany({
    where: {
      closeDate: { gte: cleanupStart, lt: cleanupEnd }
    }
  });

  await prisma.productionLog.deleteMany({
    where: {
      createdAt: { gte: cleanupStart, lt: cleanupEnd }
    }
  });

  // Limpiar logs de auditoría de octubre para dejar estrictamente los 3 solicitados
  await prisma.auditLog.deleteMany({
    where: {
      createdAt: { gte: cleanupStart, lt: cleanupEnd }
    }
  });

  console.log('Registros previos de octubre limpiados correctamente.');

  // Configuración de los 3 días
  const days = [
    { dateStr: '2026-10-01', factor: 1.01, isComplete: true },   // Jueves: Jornada completa cerrada
    { dateStr: '2026-10-02', factor: 1.10, isComplete: true },   // Viernes: Jornada completa cerrada
    { dateStr: '2026-10-03', factor: 1.15, isComplete: false },  // Sábado (HOY): Solo horneado matutino
  ];

  const productionLogsData = [];
  const stockMovementsData = [];
  const dailyClosesData = [];

  let oct1Summary = null;
  let oct2Summary = null;
  let oct3BakedStats = { latas: 0, unidades: 0 };

  for (const day of days) {
    const { dateStr, factor, isComplete } = day;

    const bakeTime = new Date(`${dateStr}T06:00:00-06:00`);     // 06:00 AM local
    const prodTime = new Date(`${dateStr}T06:15:00-06:00`);     // 06:15 AM local
    const transferTime = new Date(`${dateStr}T06:30:00-06:00`); // 06:30 AM local
    const salesTime = new Date(`${dateStr}T15:00:00-06:00`);    // 03:00 PM local
    const wasteTime = new Date(`${dateStr}T15:30:00-06:00`);    // 03:30 PM local
    const closeTimeCentral = dateStr === '2026-10-01'
      ? new Date(`${dateStr}T20:05:00-06:00`)  // 08:05 PM local (Jueves 1 oct - Buena Vista)
      : new Date(`${dateStr}T20:11:00-06:00`); // 08:11 PM local (Viernes 2 oct - Buena Vista)

    const closeTimeSecundaria = dateStr === '2026-10-01'
      ? new Date(`${dateStr}T20:18:00-06:00`)  // 08:18 PM local (Jueves 1 oct - Secundaria)
      : new Date(`${dateStr}T20:24:00-06:00`); // 08:24 PM local (Viernes 2 oct - Secundaria)
    const closeDate = new Date(`${dateStr}T12:00:00.000Z`);     // Mediodía UTC

    const centralItems = [];
    const secundariaItems = [];

    let daySoldCentral = 0;
    let daySoldSecundaria = 0;
    let dayWasteCentral = 0;
    let dayWasteSecundaria = 0;
    let daySurplusCentral = 0;
    let daySurplusSecundaria = 0;
    let dayBakedTotal = 0;
    let dayTraysTotal = 0;

    for (const prod of PRODUCT_CONFIGS) {
      const soldCentral = Math.max(1, Math.round(prod.baseCentral * factor));
      const soldSecundaria = Math.max(1, Math.round(prod.baseSecundaria * factor));

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

      dayBakedTotal += unitsProduced;
      dayTraysTotal += trays;

      // 1. Producción / Horneado matutino en Obrador Central
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

      // 2. Traslado matutino a Sucursal Secundaria
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

      // Si la jornada está completa (1 y 2 de octubre), registrar ventas, mermas y cierres
      if (isComplete) {
        daySoldCentral += soldCentral;
        daySoldSecundaria += soldSecundaria;
        dayWasteCentral += wasteCentral;
        dayWasteSecundaria += wasteSecundaria;
        daySurplusCentral += finalSurplusCentral;
        daySurplusSecundaria += surplusSecundaria;

        // Ventas en Central
        stockMovementsData.push({
          productId: prod.id,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'VENTA',
          quantity: soldCentral,
          userId: USER_ADMIN_ID,
          createdAt: salesTime,
          note: `Despacho de mostrador en Buena Vista`
        });

        // Ventas en Secundaria
        stockMovementsData.push({
          productId: prod.id,
          fromBranchId: BRANCH_SECUNDARIA_ID,
          type: 'VENTA',
          quantity: soldSecundaria,
          userId: USER_SECUNDARIA_ID,
          createdAt: salesTime,
          note: `Despacho de mostrador en Sucursal Secundaria`
        });

        // Mermas
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

        // Ítems de cierre
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
    }

    if (isComplete) {
      dailyClosesData.push({
        dateStr,
        closeCentral: {
          branchId: BRANCH_CENTRAL_ID,
          userId: USER_ADMIN_ID,
          closeDate: closeDate,
          snapshotAt: closeTimeCentral,
          createdAt: closeTimeCentral,
          note: `Cierre operativo de jornada conciliado por Administrador Jhordy Xil`
        },
        itemsCentral: centralItems,
        closeSecundaria: {
          branchId: BRANCH_SECUNDARIA_ID,
          userId: USER_SECUNDARIA_ID,
          closeDate: closeDate,
          snapshotAt: closeTimeSecundaria,
          createdAt: closeTimeSecundaria,
          note: `Cierre de sucursal verificado y conciliado por Encargada Elena Ramirez`
        },
        itemsSecundaria: secundariaItems,
        stats: {
          dayBakedTotal,
          daySoldCentral,
          daySoldSecundaria,
          dayWasteCentral,
          dayWasteSecundaria,
          daySurplusCentral,
          daySurplusSecundaria
        }
      });

      if (dateStr === '2026-10-01') {
        oct1Summary = { dayBakedTotal, daySoldCentral, daySoldSecundaria, dayWasteCentral, dayWasteSecundaria, daySurplusCentral, daySurplusSecundaria };
      } else if (dateStr === '2026-10-02') {
        oct2Summary = { dayBakedTotal, daySoldCentral, daySoldSecundaria, dayWasteCentral, dayWasteSecundaria, daySurplusCentral, daySurplusSecundaria };
      }
    } else {
      oct3BakedStats = { latas: dayTraysTotal, unidades: dayBakedTotal };
    }
  }

  // 1. Insertar ProductionLogs
  console.log(`Insertando ${productionLogsData.length} ProductionLogs...`);
  await prisma.productionLog.createMany({ data: productionLogsData });

  // 2. Insertar StockMovements
  console.log(`Insertando ${stockMovementsData.length} StockMovements...`);
  await prisma.stockMovement.createMany({ data: stockMovementsData });

  // 3. Insertar DailyCloses para 1 y 2 de octubre
  let oct1CentralCloseId = null;
  let oct1SecundariaCloseId = null;
  let oct2CentralCloseId = null;
  let oct2SecundariaCloseId = null;

  for (const dayClose of dailyClosesData) {
    const cCentral = await prisma.dailyClose.create({ data: dayClose.closeCentral });
    await prisma.dailyCloseItem.createMany({
      data: dayClose.itemsCentral.map(it => ({ ...it, dailyCloseId: cCentral.id }))
    });

    const cSecundaria = await prisma.dailyClose.create({ data: dayClose.closeSecundaria });
    await prisma.dailyCloseItem.createMany({
      data: dayClose.itemsSecundaria.map(it => ({ ...it, dailyCloseId: cSecundaria.id }))
    });

    if (dayClose.dateStr === '2026-10-01') {
      oct1CentralCloseId = cCentral.id;
      oct1SecundariaCloseId = cSecundaria.id;
    }
    if (dayClose.dateStr === '2026-10-02') {
      oct2CentralCloseId = cCentral.id;
      oct2SecundariaCloseId = cSecundaria.id;
    }
  }
  console.log('Cierres diarios e items de 1 y 2 de octubre guardados.');

  // 4. Actualizar stock actual en Inventory para hoy 3 de octubre
  // En Central quedan disponibles las unidades horneadas menos las trasladadas a Secundaria
  for (const prod of PRODUCT_CONFIGS) {
    const factorHoy = 1.15;
    const soldCentral = Math.max(1, Math.round(prod.baseCentral * factorHoy));
    const soldSecundaria = Math.max(1, Math.round(prod.baseSecundaria * factorHoy));
    const wasteCentral = 3;
    const wasteSecundaria = 1;
    const surplusCentral = Math.max(1, Math.round(soldCentral * 0.045));
    const surplusSecundaria = Math.max(1, Math.round(soldSecundaria * 0.045));
    const neededSecundaria = soldSecundaria + surplusSecundaria + wasteSecundaria;
    const neededCentral = soldCentral + surplusCentral + wasteCentral;
    const trays = Math.ceil((neededCentral + neededSecundaria) / prod.unitsPerTray);
    const unitsProduced = trays * prod.unitsPerTray;
    const availableCentral = unitsProduced - neededSecundaria;

    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: prod.id, branchId: BRANCH_CENTRAL_ID } },
      update: { quantity: availableCentral, updatedAt: new Date('2026-10-03T06:30:00-06:00') },
      create: { productId: prod.id, branchId: BRANCH_CENTRAL_ID, quantity: availableCentral }
    });

    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: prod.id, branchId: BRANCH_SECUNDARIA_ID } },
      update: { quantity: neededSecundaria, updatedAt: new Date('2026-10-03T06:30:00-06:00') },
      create: { productId: prod.id, branchId: BRANCH_SECUNDARIA_ID, quantity: neededSecundaria }
    });
  }
  console.log('Inventario fisico en tienda actualizado para la jornada de hoy.');

  // 5. Insercion de los 5 Registros de Auditoria Solicitados
  console.log('\nCreando los 5 registros de auditoria en /historial...');

  // 1 de Octubre - Central (Jhordy Xil, 08:05 PM)
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'DailyClose',
      entityId: String(oct1CentralCloseId),
      entityName: 'Cierre de Jornada 1 oct 2026 - Panaderia Buena Vista',
      userName: 'Jhordy Xil',
      userId: USER_ADMIN_ID,
      details: {
        fecha: '1 de octubre 2026',
        sucursal: 'Panaderia Buena Vista',
        responsable: 'Jhordy Xil (ADMIN)',
        totalHorneado: oct1Summary.dayBakedTotal,
        totalVentas: oct1Summary.daySoldCentral,
        totalSobrante: oct1Summary.daySurplusCentral,
        totalMerma: oct1Summary.dayWasteCentral,
        estado: 'CONCILIADO'
      },
      createdAt: new Date('2026-10-01T20:05:00-06:00')
    }
  });

  // 1 de Octubre - Secundaria (Elena Ramirez, 08:18 PM)
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'DailyClose',
      entityId: String(oct1SecundariaCloseId),
      entityName: 'Cierre de Jornada 1 oct 2026 - Panaderia Secundaria',
      userName: 'Elena Ramirez',
      userId: USER_SECUNDARIA_ID,
      details: {
        fecha: '1 de octubre 2026',
        sucursal: 'Panaderia Secundaria',
        responsable: 'Elena Ramirez (MANAGER)',
        totalRecibido: oct1Summary.daySoldSecundaria + oct1Summary.daySurplusSecundaria + oct1Summary.dayWasteSecundaria,
        totalVentas: oct1Summary.daySoldSecundaria,
        totalSobrante: oct1Summary.daySurplusSecundaria,
        totalMerma: oct1Summary.dayWasteSecundaria,
        estado: 'CONCILIADO'
      },
      createdAt: new Date('2026-10-01T20:18:00-06:00')
    }
  });

  // 2 de Octubre - Central (Jhordy Xil, 08:11 PM)
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'DailyClose',
      entityId: String(oct2CentralCloseId),
      entityName: 'Cierre de Jornada 2 oct 2026 - Panaderia Buena Vista',
      userName: 'Jhordy Xil',
      userId: USER_ADMIN_ID,
      details: {
        fecha: '2 de octubre 2026',
        sucursal: 'Panaderia Buena Vista',
        responsable: 'Jhordy Xil (ADMIN)',
        totalHorneado: oct2Summary.dayBakedTotal,
        totalVentas: oct2Summary.daySoldCentral,
        totalSobrante: oct2Summary.daySurplusCentral,
        totalMerma: oct2Summary.dayWasteCentral,
        estado: 'CONCILIADO'
      },
      createdAt: new Date('2026-10-02T20:11:00-06:00')
    }
  });

  // 2 de Octubre - Secundaria (Elena Ramirez, 08:24 PM)
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'DailyClose',
      entityId: String(oct2SecundariaCloseId),
      entityName: 'Cierre de Jornada 2 oct 2026 - Panaderia Secundaria',
      userName: 'Elena Ramirez',
      userId: USER_SECUNDARIA_ID,
      details: {
        fecha: '2 de octubre 2026',
        sucursal: 'Panaderia Secundaria',
        responsable: 'Elena Ramirez (MANAGER)',
        totalRecibido: oct2Summary.daySoldSecundaria + oct2Summary.daySurplusSecundaria + oct2Summary.dayWasteSecundaria,
        totalVentas: oct2Summary.daySoldSecundaria,
        totalSobrante: oct2Summary.daySurplusSecundaria,
        totalMerma: oct2Summary.dayWasteSecundaria,
        estado: 'CONCILIADO'
      },
      createdAt: new Date('2026-10-02T20:24:00-06:00')
    }
  });

  // 3 de Octubre - Horneado Matutino en Tanda (Carlos Morales, 06:15 AM)
  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entity: 'StockMovement',
      entityId: 'BATCH-20261003-01',
      entityName: `Horneado Matutino en Tanda (${oct3BakedStats.latas} latas) - 3 oct 2026`,
      userName: 'Carlos Morales',
      userId: USER_BAKER_ID,
      details: {
        fecha: '3 de octubre 2026',
        obrador: 'Panaderia Buena Vista (Central)',
        panadero: 'Carlos Morales (Panadero)',
        totalLatas: oct3BakedStats.latas,
        totalUnidades: oct3BakedStats.unidades,
        tipo: 'PRODUCCION',
        estado: 'EN_PROCESO'
      },
      createdAt: new Date('2026-10-03T06:15:00-06:00')
    }
  });

  console.log('Los 5 registros de auditoria han sido creados con exito.');
  console.log('\n================================================================');
  console.log('RESUMEN DE OCTUBRE:');
  console.log('   - 1 oct Buena Vista: Cierre a las 08:05 PM (Jhordy Xil)');
  console.log('   - 1 oct Secundaria:  Cierre a las 08:18 PM (Elena Ramirez)');
  console.log('   - 2 oct Buena Vista: Cierre a las 08:11 PM (Jhordy Xil)');
  console.log('   - 2 oct Secundaria:  Cierre a las 08:24 PM (Elena Ramirez)');
  console.log(`   - 3 oct Central:     Horneado matutino (${oct3BakedStats.unidades} uds / ${oct3BakedStats.latas} latas por Carlos Morales)`);
  console.log('   - /historial: Muestra los 5 registros detallados por sucursal.');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Error en carga de octubre:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
