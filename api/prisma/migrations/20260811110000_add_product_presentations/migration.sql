-- Presentaciones comerciales y operativas sin duplicar productos ni inventarios.
ALTER TABLE "Product"
  ADD COLUMN "stockUnitLabel" TEXT NOT NULL DEFAULT 'unidades';

CREATE TABLE "ProductPresentation" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "unitsInStock" INTEGER NOT NULL,
  "price" DECIMAL(10, 2),
  "isForSale" BOOLEAN NOT NULL DEFAULT true,
  "isForProduction" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductPresentation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderItem"
  ADD COLUMN "presentationId" INTEGER,
  ADD COLUMN "presentationName" TEXT,
  ADD COLUMN "presentationQuantity" INTEGER,
  ADD COLUMN "presentationUnits" INTEGER;

ALTER TABLE "ProductionLog"
  ADD COLUMN "presentationId" INTEGER,
  ADD COLUMN "presentationName" TEXT,
  ADD COLUMN "presentationQuantity" INTEGER,
  ADD COLUMN "presentationUnits" INTEGER;

CREATE UNIQUE INDEX "ProductPresentation_productId_name_key"
  ON "ProductPresentation"("productId", "name");
CREATE INDEX "ProductPresentation_productId_isActive_isForSale_idx"
  ON "ProductPresentation"("productId", "isActive", "isForSale");
CREATE INDEX "ProductPresentation_productId_isActive_isForProduction_idx"
  ON "ProductPresentation"("productId", "isActive", "isForProduction");
CREATE INDEX "OrderItem_presentationId_idx" ON "OrderItem"("presentationId");
CREATE INDEX "ProductionLog_presentationId_idx" ON "ProductionLog"("presentationId");

ALTER TABLE "ProductPresentation"
  ADD CONSTRAINT "ProductPresentation_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_presentationId_fkey"
  FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductionLog"
  ADD CONSTRAINT "ProductionLog_presentationId_fkey"
  FOREIGN KEY ("presentationId") REFERENCES "ProductPresentation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrar los combos existentes a presentaciones para que el catálogo conserve
-- su comportamiento actual sin obligar a crear productos duplicados.
INSERT INTO "ProductPresentation" (
  "productId", "name", "unitsInStock", "price", "isForSale", "isForProduction",
  "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  p."id",
  'Combo de ' || p."comboQuantity"::text,
  p."comboQuantity",
  p."comboPrice",
  true,
  false,
  true,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."comboQuantity" IS NOT NULL
  AND p."comboQuantity" > 0
  AND p."comboPrice" IS NOT NULL
  AND p."slug" <> 'pan-frances'
  AND NOT EXISTS (
    SELECT 1
    FROM "ProductPresentation" pp
    WHERE pp."productId" = p."id"
      AND pp."name" = 'Combo de ' || p."comboQuantity"::text
  );

-- Configuración inicial del caso solicitado: el precio visible y operativo
-- corresponde a media tira (3 piezas) o tira completa (6 piezas).
UPDATE "Product"
SET "stockUnitLabel" = 'piezas'
WHERE "slug" = 'pan-frances';

INSERT INTO "ProductPresentation" (
  "productId", "name", "unitsInStock", "price", "isForSale", "isForProduction",
  "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT p."id", 'Media tira', 3, COALESCE(p."comboPrice", 1.25), true, true, false, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."slug" = 'pan-frances'
  AND NOT EXISTS (
    SELECT 1 FROM "ProductPresentation" pp
    WHERE pp."productId" = p."id" AND pp."name" = 'Media tira'
  );

INSERT INTO "ProductPresentation" (
  "productId", "name", "unitsInStock", "price", "isForSale", "isForProduction",
  "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt"
)
SELECT p."id", 'Tira completa', 6, COALESCE(p."comboPrice" * 2, 2.50), true, true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."slug" = 'pan-frances'
  AND NOT EXISTS (
    SELECT 1 FROM "ProductPresentation" pp
    WHERE pp."productId" = p."id" AND pp."name" = 'Tira completa'
  );

UPDATE "ProductPresentation" pp
SET "isDefault" = (pp."name" = 'Tira completa')
FROM "Product" p
WHERE pp."productId" = p."id"
  AND p."slug" = 'pan-frances'
  AND pp."name" IN ('Media tira', 'Tira completa');

ALTER TABLE "ProductPresentation" ENABLE ROW LEVEL SECURITY;
