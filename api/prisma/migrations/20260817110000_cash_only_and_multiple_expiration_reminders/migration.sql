-- Payment is collected as cash at pickup only. Legacy test values are not
-- converted to cash because that would create a false payment record.
UPDATE "Order"
SET "paymentMethod" = NULL
WHERE "paymentMethod" IS NOT NULL
  AND "paymentMethod"::text <> 'EFECTIVO';

ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE TEXT
  USING "paymentMethod"::text;

DROP TYPE "PaymentMethod";
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO');

ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod"
  USING "paymentMethod"::"PaymentMethod";

ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" SET DEFAULT 'EFECTIVO'::"PaymentMethod";

-- Preserve the existing reminder configuration while allowing several dates.
ALTER TABLE "Product"
  ALTER COLUMN "expirationAlertDays" DROP DEFAULT;

ALTER TABLE "Product"
  ALTER COLUMN "expirationAlertDays" TYPE INTEGER[]
  USING ARRAY["expirationAlertDays"]::INTEGER[];

ALTER TABLE "Product"
  ALTER COLUMN "expirationAlertDays" SET DEFAULT ARRAY[3]::INTEGER[];

-- Produced products never use expiration reminders, even if the old scalar
-- field had been populated by the previous default or migration.
UPDATE "Product"
SET "expirationAlertDays" = ARRAY[]::INTEGER[]
WHERE "origin" = 'PRODUCIDO';

-- Remove the retired product-low alert type. Its state belongs to the old
-- notification model and is no longer part of the two-alert scope.
DELETE FROM "AlertState"
WHERE "alertType" = 'PRODUCT_LOW';

ALTER TYPE "AlertType" RENAME TO "AlertType_old";
CREATE TYPE "AlertType" AS ENUM ('RAW_MATERIAL_LOW', 'PRODUCT_EXPIRY');

ALTER TABLE "AlertState"
  ALTER COLUMN "alertType" TYPE "AlertType"
  USING "alertType"::text::"AlertType";

DROP TYPE "AlertType_old";

-- Keep only the two operational notification rules in the database.
DELETE FROM "NotificationConfig"
WHERE "key" NOT IN ('inventory.raw_material_low', 'inventory.expiration_warning');

-- The old single-reminder resource key maps to the default three-day stage.
-- This prevents a duplicate notification after the new scanner is deployed.
UPDATE "AlertState" AS state
SET "resourceKey" = state."resourceKey" || ':3'
WHERE state."alertType" = 'PRODUCT_EXPIRY'
  AND state."resourceKey" LIKE 'lot:%:warning'
  AND state."resourceKey" NOT LIKE '%:warning:%'
  AND NOT EXISTS (
    SELECT 1
    FROM "AlertState" AS existing
    WHERE existing."branchId" = state."branchId"
      AND existing."alertType" = state."alertType"
      AND existing."resourceKey" = state."resourceKey" || ':3'
  );

UPDATE "NotificationConfig"
SET "message" = '{productName}: quedan {quantity} unidades y caduca el {expiresAt} ({daysBefore} días de anticipación) en {branchName}'
WHERE "key" = 'inventory.expiration_warning';
