-- Add new enum value for OrderStatus
DO $$ BEGIN
	ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

-- Remove obsolete column from Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "stock";

-- Add branchId to Order and its foreign key
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "branchId" INTEGER;
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Order_branchId_idx" ON "Order"("branchId");

