-- Control de caducidad por producto y trazabilidad por lote.
ALTER TYPE "AlertType" ADD VALUE 'PRODUCT_EXPIRY';
CREATE TYPE "InventoryLotSource" AS ENUM ('PRODUCCION', 'COMPRA', 'TRANSFERENCIA', 'SOBRANTE', 'APERTURA');

ALTER TABLE "Product"
  ADD COLUMN "tracksExpiration" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "expirationAlertDays" INTEGER NOT NULL DEFAULT 3;

CREATE TABLE "InventoryLot" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "branchId" INTEGER NOT NULL,
  "sourceType" "InventoryLotSource" NOT NULL,
  "sourceMovementId" INTEGER,
  "initialQuantity" INTEGER NOT NULL,
  "availableQuantity" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "alertAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryLotConsumption" (
  "id" SERIAL NOT NULL,
  "lotId" INTEGER NOT NULL,
  "stockMovementId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryLotConsumption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryLot_productId_branchId_idx" ON "InventoryLot"("productId", "branchId");
CREATE INDEX "InventoryLot_branchId_expiresAt_idx" ON "InventoryLot"("branchId", "expiresAt");
CREATE INDEX "InventoryLot_availableQuantity_idx" ON "InventoryLot"("availableQuantity");
CREATE INDEX "InventoryLot_sourceMovementId_idx" ON "InventoryLot"("sourceMovementId");
CREATE UNIQUE INDEX "InventoryLotConsumption_lotId_stockMovementId_key" ON "InventoryLotConsumption"("lotId", "stockMovementId");
CREATE INDEX "InventoryLotConsumption_stockMovementId_idx" ON "InventoryLotConsumption"("stockMovementId");

ALTER TABLE "InventoryLot"
  ADD CONSTRAINT "InventoryLot_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryLot_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryLot_sourceMovementId_fkey"
  FOREIGN KEY ("sourceMovementId") REFERENCES "StockMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InventoryLotConsumption"
  ADD CONSTRAINT "InventoryLotConsumption_lotId_fkey"
  FOREIGN KEY ("lotId") REFERENCES "InventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InventoryLotConsumption_stockMovementId_fkey"
  FOREIGN KEY ("stockMovementId") REFERENCES "StockMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- El inventario que ya existía queda disponible como lote de apertura sin fecha.
-- No se inventan fechas ni se generan alertas retroactivas.
INSERT INTO "InventoryLot" (
  "productId", "branchId", "sourceType", "initialQuantity", "availableQuantity", "createdAt", "updatedAt"
)
SELECT "productId", "branchId", 'APERTURA', "quantity", "quantity", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Inventory"
WHERE "quantity" > 0;

ALTER TABLE "InventoryLot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryLotConsumption" ENABLE ROW LEVEL SECURITY;
