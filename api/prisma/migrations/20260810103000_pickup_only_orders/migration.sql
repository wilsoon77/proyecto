-- El ecommerce solo conserva catálogo, carrito y retiro en sucursal.
-- Se eliminan los datos estructurales exclusivos de entrega a domicilio.
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_addressId_fkey";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "addressId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryFee";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "shippingMethod";
DROP TABLE IF EXISTS "Address";

-- Los estados de entrega ya no forman parte del flujo operativo.
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_legacy";
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'CANCELLED',
  'PICKED_UP'
);

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE "status"::text
      WHEN 'IN_DELIVERY' THEN 'PICKED_UP'::"OrderStatus"
      WHEN 'DELIVERED' THEN 'PICKED_UP'::"OrderStatus"
      ELSE "status"::text::"OrderStatus"
    END
  );

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_legacy";
