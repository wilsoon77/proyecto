import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// IDs de Sucursales
const BRANCH_CENTRAL_ID = 1;     // Panaderia Buena Vista
const BRANCH_SECUNDARIA_ID = 33; // Panaderia Secundaria

// IDs de Usuarios
const USER_ADMIN_ID = '39579283-0d8b-4a4c-96ce-4934b520e32c';     // Jhordy Xil (ADMIN)
const USER_BAKER_ID = '4ad725f8-d5a3-4b9f-a38d-1ee4440a4848';     // Carlos Morales (BAKER)
const USER_SECUNDARIA_ID = '989de1e7-e8ae-4006-bab6-1f770676afcf'; // Elena Ramirez (MANAGER)
const USER_CENTRAL_MGR_ID = '555f113b-be24-4f49-8055-5367ac4c03a6'; // Roberto Gomez (MANAGER)

// 18 Productos de Panadería
const PRODUCT_CONFIGS = [
  { id: 54, name: 'Pan Francés Tradicional', price: 0.50, unitsPerTray: 36, recipeId: 35, baseCentral: 750, baseSecundaria: 420, wasteProb: 0.95, baseWaste: 5 },
  { id: 55, name: 'Pan Dulce Pequeño', price: 0.50, unitsPerTray: 40, recipeId: 38, baseCentral: 180, baseSecundaria: 100, wasteProb: 0.5, baseWaste: 2 },
  { id: 56, name: 'Pan Dulce Grande', price: 1.25, unitsPerTray: 20, recipeId: 36, baseCentral: 60, baseSecundaria: 32, wasteProb: 0.4, baseWaste: 1 },
  { id: 69, name: 'Pasitas', price: 0.75, unitsPerTray: 30, recipeId: 49, baseCentral: 40, baseSecundaria: 20, wasteProb: 0.3, baseWaste: 1 },
  { id: 68, name: 'Campechana', price: 1.25, unitsPerTray: 20, recipeId: 48, baseCentral: 40, baseSecundaria: 20, wasteProb: 0.4, baseWaste: 1 },
  { id: 58, name: 'Champurrada Pequeña', price: 0.50, unitsPerTray: 24, recipeId: 40, baseCentral: 80, baseSecundaria: 45, wasteProb: 0.7, baseWaste: 2 },
  { id: 59, name: 'Champurrada Grande', price: 1.25, unitsPerTray: 15, recipeId: 39, baseCentral: 30, baseSecundaria: 16, wasteProb: 0.5, baseWaste: 1 },
  { id: 57, name: 'Pan Galleta', price: 1.25, unitsPerTray: 20, recipeId: 41, baseCentral: 30, baseSecundaria: 16, wasteProb: 0.4, baseWaste: 1 },
  { id: 64, name: 'Polvorosa Tradicional', price: 1.25, unitsPerTray: 15, recipeId: 42, baseCentral: 20, baseSecundaria: 12, wasteProb: 0.3, baseWaste: 1 },
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

// Helper para generar timestamps orgánicos (horas, minutos y segundos no redondos)
function makeOrganicTime(dateStr, baseHour, baseMinute, minVariance = 6, secVariance = 58) {
  const minuteOffset = Math.floor(Math.random() * (minVariance * 2 + 1)) - minVariance;
  const sec = Math.floor(Math.random() * (secVariance + 1));
  const ms = Math.floor(Math.random() * 890) + 100;
  let h = baseHour;
  let m = baseMinute + minuteOffset;
  if (m < 0) { h -= 1; m += 60; }
  if (m >= 60) { h += 1; m -= 60; }
  const pad = (n) => String(n).padStart(2, '0');
  return new Date(`${dateStr}T${pad(h)}:${pad(m)}:${pad(sec)}.${ms}-06:00`);
}

async function main() {
  console.log('================================================================');
  console.log('ACTUALIZACION HISTORICA DE OPERACIONES HASTA EL 13 DE OCTUBRE');
  console.log('================================================================');

  // Limpieza idempotente: eliminar registros posteriores al mediodía del 3 de octubre
  const cutoffTime = new Date('2026-10-03T13:00:00-06:00');
  const cutoffDate = new Date(Date.UTC(2026, 9, 3)); // 2026-10-03

  console.log('Limpiando registros posteriores al 3 de octubre 13:00...');
  await prisma.inventoryLotConsumption.deleteMany({ where: { createdAt: { gte: cutoffTime } } });
  await prisma.inventoryLot.deleteMany({ where: { createdAt: { gte: cutoffTime } } });
  await prisma.stockMovement.deleteMany({ where: { createdAt: { gte: cutoffTime } } });
  await prisma.dailyCloseItem.deleteMany({ where: { dailyClose: { closeDate: { gte: cutoffDate } } } });
  await prisma.dailyClose.deleteMany({ where: { closeDate: { gte: cutoffDate } } });
  await prisma.productionLog.deleteMany({ where: { createdAt: { gte: new Date('2026-10-04T00:00:00-06:00') } } });
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: cutoffTime } } });

  // Restaurar lotes base
  await prisma.inventoryLot.updateMany({ where: { id: 62 }, data: { availableQuantity: 10 } });
  await prisma.inventoryLot.updateMany({ where: { id: 63 }, data: { availableQuantity: 8 } });
  await prisma.inventoryLot.updateMany({ where: { id: 64 }, data: { availableQuantity: 15 } });
  await prisma.inventoryLot.updateMany({ where: { id: 65 }, data: { availableQuantity: 60 } });

  // Restaurar inventarios base
  await prisma.inventory.updateMany({ where: { productId: 108, branchId: BRANCH_CENTRAL_ID }, data: { quantity: 10 } });
  await prisma.inventory.updateMany({ where: { productId: 74, branchId: BRANCH_CENTRAL_ID }, data: { quantity: 8 } });
  await prisma.inventory.updateMany({ where: { productId: 73, branchId: BRANCH_CENTRAL_ID }, data: { quantity: 15 } });

  // Cargar recetas para deducción de materias primas
  const recipes = await prisma.recipe.findMany({
    include: { ingredients: { include: { rawMaterial: true } } }
  });
  const recipeMap = new Map(recipes.map(r => [r.id, r]));

  // Stock inicial de materia prima en Buena Vista al 3 de octubre (sano y realista)
  const rawStock = new Map([
    [47, 1500],   // Harina Dura (LB)
    [48, 500],    // Harina Suave (LB)
    [49, 200],    // Azúcar Blanca (LB)
    [51, 300],    // Huevos (UNIT)
    [52, 150],    // Manteca Vegetal (LB)
    [53, 50],     // Margarina (LB)
    [54, 25],     // Polvo de Hornear (Royal) (LB)
    [56, 1500],   // Esencia de Vainilla (ML)
    [57, 1000],   // Esencia de Ponche (ML)
    [58, 1000],   // Solución de Yemas (ML)
    [59, 300],    // Molde de Cubilete (UNIT)
    [60, 5],      // Manga de Jalea de Piña (UNIT)
    [61, 5],      // Manga de Jalea de Fresa (UNIT)
    [62, 5],      // Manga de Manjar (UNIT)
    [63, 5],      // Cocoa Oscura (LB)
    [64, 40],     // Bicarbonato de Sodio (UNIT)
    [73, 10],     // Pasas (LB)
    [74, 5],      // Ajonjolí (LB)
    [76, 5],      // Anís (LB)
    [77, 5],      // Chocolate en Barra (Repostería) (LB)
    [80, 20000],  // Leche Entera (ML)
    [81, 50],     // Banano (UNIT)
    [82, 5],      // Canela en Polvo (LB)
    [2, 50],      // Levadura (LB)
    [3, 30],      // Sal (LB)
  ]);

  function deductIngredientsForProduction(recipeId, trays) {
    const recipe = recipeMap.get(recipeId);
    if (!recipe || !recipe.standardTrays) return;
    const factor = trays / recipe.standardTrays;
    for (const ing of recipe.ingredients) {
      const needed = Number(ing.quantity) * factor;
      const current = rawStock.get(ing.rawMaterialId) || 0;
      rawStock.set(ing.rawMaterialId, Math.max(0, current - needed));
    }
  }

  function addRawMaterialPurchase(rawMaterialId, amount) {
    const current = rawStock.get(rawMaterialId) || 0;
    rawStock.set(rawMaterialId, current + amount);
  }

  const schedule = [
    { dateStr: '2026-10-03', factor: 1.15, isOct3Afternoon: true, isComplete: true },
    { dateStr: '2026-10-05', factor: 0.96, isMonday: true, isComplete: true, hasWeeklyPurchase: true },
    { dateStr: '2026-10-06', factor: 0.98, isComplete: true },
    { dateStr: '2026-10-07', factor: 1.02, isComplete: true, hasNewExpiryBatch: true },
    { dateStr: '2026-10-08', factor: 1.04, isComplete: true, hasLot62ExpiryAudit: true },
    { dateStr: '2026-10-09', factor: 1.12, isComplete: true, hasLot63ExpiryAudit: true },
    { dateStr: '2026-10-10', factor: 1.16, isComplete: true, hasWeekendBoosterPurchase: true },
    { dateStr: '2026-10-12', factor: 0.97, isComplete: true },
    { dateStr: '2026-10-13', factor: 1.05, isTodayInProgress: true, isComplete: false },
  ];

  let freshJamonLotId = null;
  let freshQuesoLotId = null;
  let freshJugoLotId = null;

  // Acumuladores globales para inserción en bulk
  const allProductionLogs = [];
  const allStockMovements = [];
  const allDailyCloseInserts = []; // { closeDataCentral, itemsCentral, closeDataSecundaria, itemsSecundaria, auditCentral, auditSecundaria }

  for (let dayIdx = 0; dayIdx < schedule.length; dayIdx++) {
    const day = schedule[dayIdx];
    const { dateStr, factor, isOct3Afternoon, isTodayInProgress, isComplete } = day;
    const closeDate = new Date(`${dateStr}T12:00:00.000Z`);

    // ---------------------------------------------------------
    // COMPRA SEMANAL DE MATERIA PRIMA (Lunes 5 de Octubre)
    // ---------------------------------------------------------
    if (day.hasWeeklyPurchase) {
      const purchaseTime = makeOrganicTime(dateStr, 8, 14, 3, 55);
      const weeklyPurchases = [
        { id: 48, qty: 3000 }, // Harina Suave (30 qq)
        { id: 47, qty: 2000 }, // Harina Dura (20 qq)
        { id: 52, qty: 625 },  // Manteca Vegetal (25 cajas)
        { id: 53, qty: 500 },  // Margarina (20 cajas)
        { id: 49, qty: 1500 }, // Azúcar Blanca (15 qq)
        { id: 51, qty: 1200 }, // Huevos (40 cartones)
        { id: 2,  qty: 125 },  // Levadura (5 cajas)
        { id: 59, qty: 2000 }, // Moldes de Cubilete
        { id: 56, qty: 10000 },// Esencia de Vainilla (10 L)
        { id: 58, qty: 2000 }, // Solución de Yemas (2 L)
        { id: 62, qty: 30 },   // Manga de Manjar
        { id: 61, qty: 25 },   // Manga de Jalea de Fresa
        { id: 60, qty: 20 },   // Manga de Jalea de Piña
        { id: 63, qty: 25 },   // Cocoa Oscura
        { id: 77, qty: 30 },   // Chocolate en Barra
        { id: 73, qty: 30 },   // Pasas
        { id: 54, qty: 50 },   // Polvo de Hornear (Royal)
        { id: 64, qty: 50 },   // Bicarbonato de Sodio
        { id: 81, qty: 200 },  // Banano
        { id: 82, qty: 10 },   // Canela en Polvo
        { id: 74, qty: 15 },   // Ajonjolí
        { id: 76, qty: 10 },   // Anís
        { id: 3,  qty: 100 },  // Sal
      ];
      for (const p of weeklyPurchases) {
        addRawMaterialPurchase(p.id, p.qty);
      }

      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'RawMaterialInventory',
          entityId: `COMPRA-MP-${dateStr.replace(/-/g, '')}`,
          entityName: 'Llegó el camión con el pedido grande de la semana',
          userName: 'Roberto Gomez',
          userId: USER_CENTRAL_MGR_ID,
          details: {
            fecha: `${dateStr} 08:14 AM`,
            sucursal: 'Panaderia Buena Vista',
            responsable: 'Roberto Gómez',
            nota: 'Se descargaron los sacos de harina, azúcar y cajas de manteca en bodega, todo completo',
            estado: 'RECIBIDO'
          },
          createdAt: purchaseTime
        }
      });
    }

    // ---------------------------------------------------------
    // REFUERZO DE FIN DE SEMANA DE MATERIA PRIMA (Sábado 10 de Octubre)
    // ---------------------------------------------------------
    if (day.hasWeekendBoosterPurchase) {
      const boosterTime = makeOrganicTime(dateStr, 9, 31, 3, 56);
      const boosterPurchases = [
        { id: 48, qty: 1500 }, // Harina suave
        { id: 47, qty: 1000 }, // Harina dura
        { id: 51, qty: 600 },  // Huevos
        { id: 52, qty: 250 },  // Manteca
        { id: 53, qty: 250 },  // Margarina
        { id: 49, qty: 800 },  // Azúcar
        { id: 81, qty: 150 },  // Banano
        { id: 2,  qty: 50 },   // Levadura
        { id: 59, qty: 1000 }, // Moldes cubilete
      ];
      for (const b of boosterPurchases) {
        addRawMaterialPurchase(b.id, b.qty);
      }

      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'RawMaterialInventory',
          entityId: `COMPRA-MP-${dateStr.replace(/-/g, '')}`,
          entityName: 'Pedido extra de harina y huevos para el sábado',
          userName: 'Roberto Gomez',
          userId: USER_CENTRAL_MGR_ID,
          details: {
            fecha: `${dateStr} 09:31 AM`,
            sucursal: 'Panaderia Buena Vista',
            responsable: 'Roberto Gómez',
            nota: 'Trajeron sacos extra de harina suave, huevos y azúcar para el fin de semana',
            estado: 'RECIBIDO'
          },
          createdAt: boosterTime
        }
      });
    }

    // ---------------------------------------------------------
    // PRODUCTOS CON CADUCIDAD (LOTES)
    // ---------------------------------------------------------
    if (day.hasNewExpiryBatch) {
      const arrivalTime = makeOrganicTime(dateStr, 10, 14, 4, 52);
      const jamonMove = await prisma.stockMovement.create({
        data: {
          productId: 108,
          toBranchId: BRANCH_CENTRAL_ID,
          type: 'COMPRA',
          quantity: 15,
          userId: USER_CENTRAL_MGR_ID,
          referenceId: `COMPRA-EMB-${dateStr.replace(/-/g, '')}`,
          note: 'Entraron 15 paquetes de jamón toledo para la refri',
          createdAt: arrivalTime
        }
      });

      const jamonLot = await prisma.inventoryLot.create({
        data: {
          productId: 108,
          branchId: BRANCH_CENTRAL_ID,
          sourceType: 'COMPRA',
          sourceMovementId: jamonMove.id,
          initialQuantity: 15,
          availableQuantity: 15,
          expiresAt: new Date('2026-11-12T00:00:00.000Z'),
          alertAt: new Date('2026-11-02T00:00:00.000Z'),
          createdAt: arrivalTime
        }
      });
      freshJamonLotId = jamonLot.id;

      const quesoMove = await prisma.stockMovement.create({
        data: {
          productId: 74,
          toBranchId: BRANCH_CENTRAL_ID,
          type: 'COMPRA',
          quantity: 12,
          userId: USER_CENTRAL_MGR_ID,
          referenceId: `COMPRA-LAC-${dateStr.replace(/-/g, '')}`,
          note: 'Llegaron 12 quesos crema trebolac',
          createdAt: arrivalTime
        }
      });

      const quesoLot = await prisma.inventoryLot.create({
        data: {
          productId: 74,
          branchId: BRANCH_CENTRAL_ID,
          sourceType: 'COMPRA',
          sourceMovementId: quesoMove.id,
          initialQuantity: 12,
          availableQuantity: 12,
          expiresAt: new Date('2026-11-16T00:00:00.000Z'),
          alertAt: new Date('2026-11-06T00:00:00.000Z'),
          createdAt: arrivalTime
        }
      });
      freshQuesoLotId = quesoLot.id;

      await prisma.inventory.updateMany({
        where: { productId: 108, branchId: BRANCH_CENTRAL_ID },
        data: { quantity: { increment: 15 } }
      });
      await prisma.inventory.updateMany({
        where: { productId: 74, branchId: BRANCH_CENTRAL_ID },
        data: { quantity: { increment: 12 } }
      });

      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'InventoryLot',
          entityId: `LOT-${jamonLot.id}-${quesoLot.id}`,
          entityName: 'Recepción de jamón toledo y quesos crema',
          userName: 'Roberto Gomez',
          userId: USER_CENTRAL_MGR_ID,
          details: {
            fecha: `${dateStr} 10:14 AM`,
            sucursal: 'Panaderia Buena Vista',
            responsable: 'Roberto Gómez',
            nota: 'Se acomodaron en la vitrina fría con fechas de noviembre',
            jamon: 15,
            quesoCrema: 12,
            estado: 'EN_VITRINA'
          },
          createdAt: arrivalTime
        }
      });
    }

    if (day.hasLot62ExpiryAudit) {
      const discardTime = makeOrganicTime(dateStr, 17, 34, 4, 51);
      const mermaMove = await prisma.stockMovement.create({
        data: {
          productId: 108,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'MERMA',
          quantity: 1,
          userId: USER_ADMIN_ID,
          referenceId: 'MERMA-CAD-LOTE62',
          note: 'Se botó 1 jamón que se venció hoy',
          createdAt: discardTime
        }
      });

      await prisma.inventoryLotConsumption.create({
        data: { lotId: 62, stockMovementId: mermaMove.id, quantity: 1, createdAt: discardTime }
      });
      await prisma.inventoryLot.update({ where: { id: 62 }, data: { availableQuantity: 0 } });
      await prisma.inventory.updateMany({
        where: { productId: 108, branchId: BRANCH_CENTRAL_ID },
        data: { quantity: { decrement: 1 } }
      });

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'InventoryLot',
          entityId: '62',
          entityName: 'Baja de 1 paquete de jamón vencido',
          userName: 'Jhordy Xil',
          userId: USER_ADMIN_ID,
          details: {
            fecha: `${dateStr} 05:34 PM`,
            sucursal: 'Panaderia Buena Vista',
            responsable: 'Jhordy Xil',
            producto: 'Jamón Tradicional (Paquete 8 rebanadas)',
            nota: 'Se sacó de la vitrina refrigerada por fecha de vencimiento cumplida',
            descarte: 1
          },
          createdAt: discardTime
        }
      });
    }

    if (day.hasLot63ExpiryAudit) {
      const discardTime = makeOrganicTime(dateStr, 17, 48, 5, 47);
      const mermaMove = await prisma.stockMovement.create({
        data: {
          productId: 74,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'MERMA',
          quantity: 1,
          userId: USER_ADMIN_ID,
          referenceId: 'MERMA-CAD-LOTE63',
          note: 'Queso crema vencido descartado',
          createdAt: discardTime
        }
      });

      await prisma.inventoryLotConsumption.create({
        data: { lotId: 63, stockMovementId: mermaMove.id, quantity: 1, createdAt: discardTime }
      });
      await prisma.inventoryLot.update({ where: { id: 63 }, data: { availableQuantity: 0 } });
      await prisma.inventory.updateMany({
        where: { productId: 74, branchId: BRANCH_CENTRAL_ID },
        data: { quantity: { decrement: 1 } }
      });

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'InventoryLot',
          entityId: '63',
          entityName: 'Descarte de queso crema vencido',
          userName: 'Jhordy Xil',
          userId: USER_ADMIN_ID,
          details: {
            fecha: `${dateStr} 05:48 PM`,
            sucursal: 'Panaderia Buena Vista',
            responsable: 'Jhordy Xil',
            producto: 'Queso Crema 8oz',
            nota: 'Se retiró de la venta 1 unidad que venció hoy en la tarde',
            descarte: 1
          },
          createdAt: discardTime
        }
      });
    }

    if (day.hasWeekendBoosterPurchase) {
      const jugoArrivalTime = makeOrganicTime(dateStr, 11, 23, 4, 38);
      const jugoMove = await prisma.stockMovement.create({
        data: {
          productId: 73,
          toBranchId: BRANCH_CENTRAL_ID,
          type: 'COMPRA',
          quantity: 20,
          userId: USER_CENTRAL_MGR_ID,
          referenceId: `COMPRA-BEB-${dateStr.replace(/-/g, '')}`,
          note: 'Entraron 20 jugos de naranja para la refri',
          createdAt: jugoArrivalTime
        }
      });

      const jugolot = await prisma.inventoryLot.create({
        data: {
          productId: 73,
          branchId: BRANCH_CENTRAL_ID,
          sourceType: 'COMPRA',
          sourceMovementId: jugoMove.id,
          initialQuantity: 20,
          availableQuantity: 20,
          expiresAt: new Date('2026-11-25T00:00:00.000Z'),
          alertAt: new Date('2026-11-15T00:00:00.000Z'),
          createdAt: jugoArrivalTime
        }
      });
      freshJugoLotId = jugolot.id;

      await prisma.inventory.updateMany({
        where: { productId: 73, branchId: BRANCH_CENTRAL_ID },
        data: { quantity: { increment: 20 } }
      });
    }

    // Ventas de abarrotes con fecha (Jamón, Queso)
    if (!isOct3Afternoon) {
      const saleTime = makeOrganicTime(dateStr, 15, 20, 25, 50);

      const l62 = await prisma.inventoryLot.findUnique({ where: { id: 62 } });
      if (l62 && l62.availableQuantity > 1) {
        const qtyToSell = Math.min(2, l62.availableQuantity - 1);
        if (qtyToSell > 0) {
          const move = await prisma.stockMovement.create({
            data: {
              productId: 108,
              fromBranchId: BRANCH_CENTRAL_ID,
              type: 'VENTA',
              quantity: qtyToSell,
              userId: USER_ADMIN_ID,
              note: 'Venta mostrador jamón',
              createdAt: saleTime
            }
          });
          await prisma.inventoryLotConsumption.create({
            data: { lotId: 62, stockMovementId: move.id, quantity: qtyToSell, createdAt: saleTime }
          });
          await prisma.inventoryLot.update({ where: { id: 62 }, data: { availableQuantity: { decrement: qtyToSell } } });
          await prisma.inventory.updateMany({ where: { productId: 108, branchId: BRANCH_CENTRAL_ID }, data: { quantity: { decrement: qtyToSell } } });
        }
      }

      const l63 = await prisma.inventoryLot.findUnique({ where: { id: 63 } });
      if (l63 && l63.availableQuantity > 1) {
        const qtyToSell = Math.min(2, l63.availableQuantity - 1);
        if (qtyToSell > 0) {
          const move = await prisma.stockMovement.create({
            data: {
              productId: 74,
              fromBranchId: BRANCH_CENTRAL_ID,
              type: 'VENTA',
              quantity: qtyToSell,
              userId: USER_ADMIN_ID,
              note: 'Venta mostrador queso crema',
              createdAt: saleTime
            }
          });
          await prisma.inventoryLotConsumption.create({
            data: { lotId: 63, stockMovementId: move.id, quantity: qtyToSell, createdAt: saleTime }
          });
          await prisma.inventoryLot.update({ where: { id: 63 }, data: { availableQuantity: { decrement: qtyToSell } } });
          await prisma.inventory.updateMany({ where: { productId: 74, branchId: BRANCH_CENTRAL_ID }, data: { quantity: { decrement: qtyToSell } } });
        }
      }

      if (freshJamonLotId) {
        const fl = await prisma.inventoryLot.findUnique({ where: { id: freshJamonLotId } });
        if (fl && fl.availableQuantity >= 2) {
          const qty = isTodayInProgress ? 1 : 2;
          const move = await prisma.stockMovement.create({
            data: {
              productId: 108,
              fromBranchId: BRANCH_CENTRAL_ID,
              type: 'VENTA',
              quantity: qty,
              userId: USER_ADMIN_ID,
              note: 'Venta jamón toledo',
              createdAt: saleTime
            }
          });
          await prisma.inventoryLotConsumption.create({
            data: { lotId: freshJamonLotId, stockMovementId: move.id, quantity: qty, createdAt: saleTime }
          });
          await prisma.inventoryLot.update({ where: { id: freshJamonLotId }, data: { availableQuantity: { decrement: qty } } });
          await prisma.inventory.updateMany({ where: { productId: 108, branchId: BRANCH_CENTRAL_ID }, data: { quantity: { decrement: qty } } });
        }
      }

      if (freshQuesoLotId) {
        const fq = await prisma.inventoryLot.findUnique({ where: { id: freshQuesoLotId } });
        if (fq && fq.availableQuantity >= 2) {
          const qty = isTodayInProgress ? 1 : 2;
          const move = await prisma.stockMovement.create({
            data: {
              productId: 74,
              fromBranchId: BRANCH_CENTRAL_ID,
              type: 'VENTA',
              quantity: qty,
              userId: USER_ADMIN_ID,
              note: 'Venta queso crema',
              createdAt: saleTime
            }
          });
          await prisma.inventoryLotConsumption.create({
            data: { lotId: freshQuesoLotId, stockMovementId: move.id, quantity: qty, createdAt: saleTime }
          });
          await prisma.inventoryLot.update({ where: { id: freshQuesoLotId }, data: { availableQuantity: { decrement: qty } } });
          await prisma.inventory.updateMany({ where: { productId: 74, branchId: BRANCH_CENTRAL_ID }, data: { quantity: { decrement: qty } } });
        }
      }
    }

    // ---------------------------------------------------------
    // CICLO DE PANADERIA (18 PRODUCTOS)
    // ---------------------------------------------------------
    const centralItems = [];
    const secundariaItems = [];
    let dayTotalBaked = 0;
    let dayTotalLatas = 0;
    let daySoldCentral = 0;
    let daySoldSecundaria = 0;
    let dayWasteCentral = 0;
    let dayWasteSecundaria = 0;
    let daySurplusCentral = 0;
    let daySurplusSecundaria = 0;

    const bakeTimeBase = makeOrganicTime(dateStr, 5, 38, 12, 55);
    const prodTimeBase = makeOrganicTime(dateStr, 6, 12, 8, 55);
    const transferTimeBase = makeOrganicTime(dateStr, 6, 41, 10, 55);
    const salesTimeBase = makeOrganicTime(dateStr, 14, 45, 35, 55);
    const wasteTimeBase = makeOrganicTime(dateStr, 16, 25, 20, 55);
    const closeTimeCentral = makeOrganicTime(dateStr, 20, 8, 4, 52);
    const closeTimeSecundaria = makeOrganicTime(dateStr, 20, 22, 5, 54);

    for (let pIdx = 0; pIdx < PRODUCT_CONFIGS.length; pIdx++) {
      const prod = PRODUCT_CONFIGS[pIdx];

      const soldCentralExpected = Math.max(1, Math.round(prod.baseCentral * factor));
      const soldSecundariaExpected = Math.max(1, Math.round(prod.baseSecundaria * factor));

      const hasWaste = Math.random() < prod.wasteProb;
      const wasteCentral = hasWaste ? Math.max(1, Math.round(prod.baseWaste * (factor >= 1.1 ? 1.5 : 1))) : 0;
      const wasteSecundaria = hasWaste && prod.baseWaste > 1 ? 1 : 0;

      const surplusCentral = Math.max(1, Math.round(soldCentralExpected * 0.045));
      const surplusSecundaria = Math.max(1, Math.round(soldSecundariaExpected * 0.045));

      const neededSecundaria = soldSecundariaExpected + surplusSecundaria + wasteSecundaria;
      const neededCentral = soldCentralExpected + surplusCentral + wasteCentral;
      const trays = Math.ceil((neededCentral + neededSecundaria) / prod.unitsPerTray);
      const unitsProduced = trays * prod.unitsPerTray;
      const finalSurplusCentral = surplusCentral + (unitsProduced - (neededCentral + neededSecundaria));

      dayTotalBaked += unitsProduced;
      dayTotalLatas += trays;

      // Horneado y Traslado matutino (excepto tarde de 3 oct que ya existe)
      if (!isOct3Afternoon) {
        deductIngredientsForProduction(prod.recipeId, trays);

        const pBakeTime = new Date(bakeTimeBase.getTime() + pIdx * 90000 + Math.floor(Math.random() * 25000));
        const pProdTime = new Date(prodTimeBase.getTime() + pIdx * 90000 + Math.floor(Math.random() * 25000));
        const pTransTime = new Date(transferTimeBase.getTime() + pIdx * 90000 + Math.floor(Math.random() * 25000));

        const bakerNotes = [
          'Tanda de la mañana con don Carlos',
          'Amasijo temprano obrador',
          'Hornada matutina para vitrinas',
          'Amasijo de primera hora'
        ];
        const prodMoveNotes = [
          'Pan caliente directo a mostrador',
          'Recién salido de horno',
          'Entrada de pan a vitrina',
          'Listo para mostrador'
        ];
        const transMoveNotes = [
          'Envío matutino a secundaria',
          'Traslado en canastas a secundaria',
          'Pan para la sucursal de abajo',
          'Envío temprano secundaria'
        ];

        allProductionLogs.push({
          recipeId: prod.recipeId,
          branchId: BRANCH_CENTRAL_ID,
          userId: USER_BAKER_ID,
          traysProduced: trays,
          unitsProduced: unitsProduced,
          note: bakerNotes[pIdx % bakerNotes.length],
          createdAt: pBakeTime
        });

        allStockMovements.push({
          productId: prod.id,
          toBranchId: BRANCH_CENTRAL_ID,
          type: 'PRODUCCION',
          quantity: unitsProduced,
          userId: USER_BAKER_ID,
          note: prodMoveNotes[pIdx % prodMoveNotes.length],
          createdAt: pProdTime
        });

        allStockMovements.push({
          productId: prod.id,
          fromBranchId: BRANCH_CENTRAL_ID,
          toBranchId: BRANCH_SECUNDARIA_ID,
          type: 'TRANSFERENCIA',
          quantity: neededSecundaria,
          userId: USER_BAKER_ID,
          note: transMoveNotes[pIdx % transMoveNotes.length],
          createdAt: pTransTime
        });
      }

      // Ventas y Mermas
      if (isTodayInProgress) {
        const soldTodayCentral = Math.max(1, Math.round(soldCentralExpected * 0.72));
        const soldTodaySecundaria = Math.max(1, Math.round(soldSecundariaExpected * 0.72));

        const pSalesTimeCentral = new Date(salesTimeBase.getTime() + pIdx * 45000 + Math.floor(Math.random() * 15000));
        const pSalesTimeSecundaria = new Date(salesTimeBase.getTime() + pIdx * 45000 + 30000 + Math.floor(Math.random() * 15000));

        allStockMovements.push({
          productId: prod.id,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'VENTA',
          quantity: soldTodayCentral,
          userId: USER_ADMIN_ID,
          note: 'Venta del día mostrador',
          createdAt: pSalesTimeCentral
        });

        allStockMovements.push({
          productId: prod.id,
          fromBranchId: BRANCH_SECUNDARIA_ID,
          type: 'VENTA',
          quantity: soldTodaySecundaria,
          userId: USER_SECUNDARIA_ID,
          note: 'Venta del turno mostrador',
          createdAt: pSalesTimeSecundaria
        });

        const remCentral = (unitsProduced - neededSecundaria) - soldTodayCentral;
        const remSecundaria = neededSecundaria - soldTodaySecundaria;

        await prisma.inventory.upsert({
          where: { productId_branchId: { productId: prod.id, branchId: BRANCH_CENTRAL_ID } },
          update: { quantity: remCentral, updatedAt: new Date() },
          create: { productId: prod.id, branchId: BRANCH_CENTRAL_ID, quantity: remCentral }
        });

        await prisma.inventory.upsert({
          where: { productId_branchId: { productId: prod.id, branchId: BRANCH_SECUNDARIA_ID } },
          update: { quantity: remSecundaria, updatedAt: new Date() },
          create: { productId: prod.id, branchId: BRANCH_SECUNDARIA_ID, quantity: remSecundaria }
        });

      } else {
        daySoldCentral += soldCentralExpected;
        daySoldSecundaria += soldSecundariaExpected;
        dayWasteCentral += wasteCentral;
        dayWasteSecundaria += wasteSecundaria;
        daySurplusCentral += finalSurplusCentral;
        daySurplusSecundaria += surplusSecundaria;

        const pSalesTimeCentral = new Date(salesTimeBase.getTime() + pIdx * 45000 + Math.floor(Math.random() * 20000));
        const pSalesTimeSecundaria = new Date(salesTimeBase.getTime() + pIdx * 45000 + 35000 + Math.floor(Math.random() * 20000));
        const pWasteTimeCentral = new Date(wasteTimeBase.getTime() + pIdx * 35000 + Math.floor(Math.random() * 15000));
        const pWasteTimeSecundaria = new Date(wasteTimeBase.getTime() + pIdx * 35000 + 25000 + Math.floor(Math.random() * 15000));

        const centralWasteNotes = [
          'Pan quebrado al acomodar',
          'Se tostó de más en el horno',
          'Se quebró en la vitrina',
          'Pan tostado golpeado'
        ];
        const secundariaWasteNotes = [
          'Se aplastó en el traslado',
          'Pan quebrado en canasta',
          'Dañado al empacar'
        ];

        allStockMovements.push({
          productId: prod.id,
          fromBranchId: BRANCH_CENTRAL_ID,
          type: 'VENTA',
          quantity: soldCentralExpected,
          userId: USER_ADMIN_ID,
          note: 'Venta del día mostrador',
          createdAt: pSalesTimeCentral
        });

        allStockMovements.push({
          productId: prod.id,
          fromBranchId: BRANCH_SECUNDARIA_ID,
          type: 'VENTA',
          quantity: soldSecundariaExpected,
          userId: USER_SECUNDARIA_ID,
          note: 'Venta mostrador secundaria',
          createdAt: pSalesTimeSecundaria
        });

        if (wasteCentral > 0) {
          allStockMovements.push({
            productId: prod.id,
            fromBranchId: BRANCH_CENTRAL_ID,
            type: 'MERMA',
            quantity: wasteCentral,
            userId: USER_ADMIN_ID,
            note: centralWasteNotes[pIdx % centralWasteNotes.length],
            createdAt: pWasteTimeCentral
          });
        }

        if (wasteSecundaria > 0) {
          allStockMovements.push({
            productId: prod.id,
            fromBranchId: BRANCH_SECUNDARIA_ID,
            type: 'MERMA',
            quantity: wasteSecundaria,
            userId: USER_SECUNDARIA_ID,
            note: secundariaWasteNotes[pIdx % secundariaWasteNotes.length],
            createdAt: pWasteTimeSecundaria
          });
        }

        centralItems.push({
          productId: prod.id,
          productName: prod.name,
          systemQty: finalSurplusCentral,
          reservedQty: 0,
          countedQty: finalSurplusCentral,
          wasteQty: wasteCentral,
          soldQty: soldCentralExpected,
          surplusQty: finalSurplusCentral
        });

        secundariaItems.push({
          productId: prod.id,
          productName: prod.name,
          systemQty: surplusSecundaria,
          reservedQty: 0,
          countedQty: surplusSecundaria,
          wasteQty: wasteSecundaria,
          soldQty: soldSecundariaExpected,
          surplusQty: surplusSecundaria
        });
      }
    }

    if (isComplete) {
      const centralCloseNotes = [
        'Cierre de turno noche todo cuadrado',
        'Cierre del día sin diferencias',
        'Cuadró caja y vitrina',
        'Cierre normal de jornada',
        'Todo entregado y limpio para mañana'
      ];
      const secundariaCloseNotes = [
        'Cierre secundaria todo en orden',
        'Caja cuadrada turno tarde',
        'Sin novedades al cierre',
        'Todo revisado y cerrado',
        'Cierre del día completo'
      ];

      allDailyCloseInserts.push({
        dateStr,
        closeCentralData: {
          branchId: BRANCH_CENTRAL_ID,
          userId: USER_ADMIN_ID,
          closeDate,
          snapshotAt: closeTimeCentral,
          createdAt: closeTimeCentral,
          note: centralCloseNotes[dayIdx % centralCloseNotes.length]
        },
        itemsCentral: centralItems,
        closeSecundariaData: {
          branchId: BRANCH_SECUNDARIA_ID,
          userId: USER_SECUNDARIA_ID,
          closeDate,
          snapshotAt: closeTimeSecundaria,
          createdAt: closeTimeSecundaria,
          note: secundariaCloseNotes[dayIdx % secundariaCloseNotes.length]
        },
        itemsSecundaria: secundariaItems,
        daySoldCentral,
        daySurplusCentral,
        dayWasteCentral,
        daySoldSecundaria,
        daySurplusSecundaria,
        dayWasteSecundaria,
        closeTimeCentral,
        closeTimeSecundaria
      });
    } else if (isTodayInProgress) {
      const auditBakeTime = new Date('2026-10-13T05:54:11.729-06:00');
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'StockMovement',
          entityId: 'BATCH-20261013-01',
          entityName: `Hornada de la mañana con don Carlos (${dayTotalLatas} latas)`,
          userName: 'Carlos Morales',
          userId: USER_BAKER_ID,
          details: {
            fecha: '13 de octubre 2026',
            panadero: 'Carlos Morales',
            totalLatas: dayTotalLatas,
            totalUnidades: dayTotalBaked,
            nota: 'Tanda completa horneada temprano para ambas tiendas'
          },
          createdAt: auditBakeTime
        }
      });
    }
  }

  // Inserción en bulk de ProductionLogs y StockMovements
  console.log(`Insertando ${allProductionLogs.length} ProductionLogs en bloque...`);
  await prisma.productionLog.createMany({ data: allProductionLogs });

  console.log(`Insertando ${allStockMovements.length} StockMovements en bloque...`);
  await prisma.stockMovement.createMany({ data: allStockMovements });

  // Inserción de Cierres Diarios y sus Items
  console.log(`Creando cierres diarios para ${allDailyCloseInserts.length} fechas...`);
  for (const c of allDailyCloseInserts) {
    const createdCentral = await prisma.dailyClose.create({ data: c.closeCentralData });
    await prisma.dailyCloseItem.createMany({
      data: c.itemsCentral.map(it => ({ ...it, dailyCloseId: createdCentral.id }))
    });

    const createdSecundaria = await prisma.dailyClose.create({ data: c.closeSecundariaData });
    await prisma.dailyCloseItem.createMany({
      data: c.itemsSecundaria.map(it => ({ ...it, dailyCloseId: createdSecundaria.id }))
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'DailyClose',
        entityId: String(createdCentral.id),
        entityName: `Cierre de caja noche Jhordy - ${c.dateStr}`,
        userName: 'Jhordy Xil',
        userId: USER_ADMIN_ID,
        details: {
          fecha: c.dateStr,
          sucursal: 'Panaderia Buena Vista',
          responsable: 'Jhordy Xil',
          nota: 'Cuadró caja y conteo de pan de la noche sin problemas',
          ventas: c.daySoldCentral,
          merma: c.dayWasteCentral
        },
        createdAt: c.closeTimeCentral
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'DailyClose',
        entityId: String(createdSecundaria.id),
        entityName: `Cierre sucursal secundaria Elena - ${c.dateStr}`,
        userName: 'Elena Ramirez',
        userId: USER_SECUNDARIA_ID,
        details: {
          fecha: c.dateStr,
          sucursal: 'Panaderia Secundaria',
          responsable: 'Elena Ramírez',
          nota: 'Todo revisado y cuadrado al finalizar turno',
          ventas: c.daySoldSecundaria,
          merma: c.dayWasteSecundaria
        },
        createdAt: c.closeTimeSecundaria
      }
    });
  }

  // Persistir inventario final de materias primas
  console.log('\nPersistiendo inventario de materias primas con IDs reales...');
  for (const [rmId, qty] of rawStock.entries()) {
    await prisma.rawMaterialInventory.updateMany({
      where: { rawMaterialId: rmId, branchId: BRANCH_CENTRAL_ID },
      data: { quantity: Math.round(qty * 100) / 100 }
    });
  }

  console.log('\n================================================================');
  console.log('ACTUALIZACION EXITOSA:');
  console.log('   - 3 al 12 de octubre: 8 jornadas cerradas (domingos 4 y 11 cerrados)');
  console.log('   - 13 de octubre: Jornada de hoy en curso con horneado, traslados y ventas activas');
  console.log('   - Notas de registros humanas, naturales y sin plantillas corporativas');
  console.log('   - Materia prima: Reabastecimiento semanal y refuerzo registrados con éxito');
  console.log('   - Lotes de caducidad: Jamón y Queso Crema rotados, lote caducado descartado');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Error durante la actualización:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
