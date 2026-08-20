-- Hardening derived from the technical and entity-relation audits.

-- OAuth profiles may not have a local password.
ALTER TABLE "User"
  ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Master data is deactivated instead of physically removed.
ALTER TABLE "Category"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Branch"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Refresh tokens are opaque and looked up by an exact SHA-256 digest.
CREATE UNIQUE INDEX "RefreshToken_hashedToken_key"
  ON "RefreshToken"("hashedToken");

-- Images are weak dependents and positions must be unique per product.
ALTER TABLE "ProductImage"
  DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE "ProductImage"
  ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ProductImage_productId_position_key"
  ON "ProductImage"("productId", "position");

-- A product cannot have two recipes with the same name.
CREATE UNIQUE INDEX "Recipe_productId_name_key"
  ON "Recipe"("productId", "name");

-- FEFO query index: product + branch are the selectors, then stock/date order.
DROP INDEX IF EXISTS "InventoryLot_availableQuantity_idx";
CREATE INDEX "InventoryLot_productId_branchId_availableQuantity_expiresAt_idx"
  ON "InventoryLot"("productId", "branchId", "availableQuantity", "expiresAt");

-- Reservations have an explicit two-hour deadline by default. Existing pending
-- test/legacy rows receive the same deadline during the rollout.
ALTER TABLE "Order"
  ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "Order"
SET "expiresAt" = "createdAt" + INTERVAL '2 hours'
WHERE "status" = 'PENDING' AND "expiresAt" IS NULL;
CREATE INDEX "Order_status_expiresAt_idx"
  ON "Order"("status", "expiresAt");

-- Payment methods are a closed domain. Unknown legacy strings are retained as
-- OTRO instead of making the migration fail on test/legacy rows.
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO');
ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
  USING CASE
    WHEN "paymentMethod" IS NULL THEN NULL
    WHEN upper("paymentMethod") IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO')
      THEN upper("paymentMethod")::"PaymentMethod"
    ELSE 'OTRO'::"PaymentMethod"
  END;

-- OrderItem.quantity is the commercial quantity. stockQuantity is the physical
-- quantity reserved/consumed. lineTotal is the authoritative money snapshot.
ALTER TABLE "OrderItem"
  ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lineTotal" DECIMAL(10, 2) NOT NULL DEFAULT 0;
UPDATE "OrderItem"
SET "stockQuantity" = "quantity";
UPDATE "OrderItem"
SET "quantity" = COALESCE("presentationQuantity", "quantity");
UPDATE "OrderItem"
SET "lineTotal" = ROUND(("quantity" * "unitPrice")::numeric, 2);
ALTER TABLE "OrderItem"
  ALTER COLUMN "stockQuantity" DROP DEFAULT,
  ALTER COLUMN "lineTotal" DROP DEFAULT;

-- ProductPresentation is the preferred combo path. This partial index protects
-- the one active/default sale presentation invariant.
CREATE UNIQUE INDEX "ProductPresentation_one_default_sale_key"
  ON "ProductPresentation"("productId")
  WHERE "isDefault" = true AND "isForSale" = true AND "isActive" = true;

-- Structured audit details avoid JSON embedded in TEXT.
ALTER TABLE "AuditLog"
  ALTER COLUMN "details" TYPE JSONB
  USING CASE
    WHEN "details" IS NULL OR btrim("details") = '' THEN NULL
    ELSE "details"::jsonb
  END;

-- Invariants that were previously enforced only by application code. NOT VALID
-- keeps deployment safe for historical test rows while enforcing all new writes;
-- they can be validated after a one-time data cleanup.
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_non_negative_check"
  CHECK ("quantity" >= 0 AND "reserved" >= 0 AND "reserved" <= "quantity") NOT VALID;

ALTER TABLE "InventoryLot"
  ADD CONSTRAINT "InventoryLot_quantities_check"
  CHECK ("initialQuantity" >= 0 AND "availableQuantity" >= 0 AND "availableQuantity" <= "initialQuantity") NOT VALID;

ALTER TABLE "StockMovement"
  ADD CONSTRAINT "StockMovement_quantity_check"
  CHECK ("quantity" > 0) NOT VALID,
  ADD CONSTRAINT "StockMovement_branch_shape_check"
  CHECK (
    ("type" IN ('PRODUCCION', 'COMPRA', 'SOBRANTE') AND "fromBranchId" IS NULL AND "toBranchId" IS NOT NULL)
    OR ("type" IN ('VENTA', 'MERMA', 'PERDIDA_ROBO') AND "fromBranchId" IS NOT NULL AND "toBranchId" IS NULL)
    OR ("type" = 'TRANSFERENCIA' AND "fromBranchId" IS NOT NULL AND "toBranchId" IS NOT NULL AND "fromBranchId" <> "toBranchId")
  ) NOT VALID,
  ADD CONSTRAINT "StockMovement_production_link_check"
  CHECK ("productionLogId" IS NULL OR "type" = 'PRODUCCION') NOT VALID,
  ADD CONSTRAINT "StockMovement_expiration_source_check"
  CHECK ("expiresAt" IS NULL OR "type" = 'COMPRA') NOT VALID;

ALTER TABLE "RecipeIngredient"
  ADD CONSTRAINT "RecipeIngredient_quantity_check"
  CHECK ("quantity" > 0) NOT VALID;

ALTER TABLE "ProductionLog"
  ADD CONSTRAINT "ProductionLog_quantities_check"
  CHECK ("traysProduced" > 0 AND "unitsProduced" > 0) NOT VALID;

ALTER TABLE "ProductPresentation"
  ADD CONSTRAINT "ProductPresentation_units_check"
  CHECK ("unitsInStock" > 0) NOT VALID;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantities_check"
  CHECK ("quantity" > 0 AND "stockQuantity" > 0 AND "lineTotal" >= 0) NOT VALID;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_total_discount_check"
  CHECK ("total" = "subtotal" - "discount") NOT VALID;
