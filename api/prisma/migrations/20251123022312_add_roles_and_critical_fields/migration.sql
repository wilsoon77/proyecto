/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productName` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `Product` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns for Product and Order
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrderItem" ADD COLUMN "productName" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerNotes" TEXT;

-- Step 2: Populate sku for existing products
UPDATE "Product" SET "sku" = 'PROD-' || LPAD(id::TEXT, 4, '0') WHERE "sku" IS NULL;

-- Step 3: Populate productName in OrderItems from Product table
UPDATE "OrderItem" 
SET "productName" = COALESCE((SELECT name FROM "Product" WHERE "Product".id = "OrderItem"."productId"), 'Unknown Product')
WHERE "productName" IS NULL;

-- Step 4: Make sku and productName required
ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "productName" SET NOT NULL;

-- Step 5: Create unique index on sku
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- Step 6: Handle UserRole enum change
-- First add a temporary text column
ALTER TABLE "User" ADD COLUMN "role_new" TEXT;

-- Copy values, mapping USER to CUSTOMER
UPDATE "User" SET "role_new" = CASE 
  WHEN "role"::TEXT = 'USER' THEN 'CUSTOMER'
  WHEN "role"::TEXT = 'ADMIN' THEN 'ADMIN'
  ELSE 'CUSTOMER'
END;

-- Drop old role column and enum
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "UserRole";

-- Create new enum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'ADMIN');

-- Recreate role column with new enum
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- Populate from temporary column
UPDATE "User" SET "role" = "role_new"::"UserRole";

-- Drop temporary column
ALTER TABLE "User" DROP COLUMN "role_new";
