/*
  Warnings:

  - The values [EMPLOYEE] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `discountPct` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - Added the required column `basePrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BaseUnit" AS ENUM ('LB', 'ML', 'UNIT');

-- CreateEnum
CREATE TYPE "UnitOfPurchase" AS ENUM ('QUINTAL', 'ARROBA', 'LIBRA', 'LITRO', 'GALON', 'CARTON', 'UNIDAD');

-- Convert existing EMPLOYEE users to MANAGER before removing the enum value
UPDATE "User" SET "role" = 'ADMIN' WHERE "role" = 'EMPLOYEE';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('CUSTOMER', 'ADMIN', 'MANAGER', 'BAKER', 'CASHIER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;

-- AlterTable: Product
-- Rename price → basePrice (preserves existing data)
ALTER TABLE "Product" RENAME COLUMN "price" TO "basePrice";
-- Drop discountPct (replaced by combo fields)
ALTER TABLE "Product" DROP COLUMN "discountPct";
-- Add new combo and production columns
ALTER TABLE "Product" ADD COLUMN "comboPrice" DECIMAL(10,2),
ADD COLUMN     "comboQuantity" INTEGER,
ADD COLUMN     "unitsPerTray" INTEGER;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "productionLogId" INTEGER;

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUnit" "BaseUnit" NOT NULL,
    "costPerUnit" DECIMAL(10,4) NOT NULL,
    "minStock" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialInventory" (
    "id" SERIAL NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawMaterialInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "standardTrays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionLog" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "traysProduced" INTEGER NOT NULL,
    "unitsProduced" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_name_key" ON "RawMaterial"("name");

-- CreateIndex
CREATE INDEX "RawMaterial_baseUnit_idx" ON "RawMaterial"("baseUnit");

-- CreateIndex
CREATE INDEX "RawMaterialInventory_branchId_idx" ON "RawMaterialInventory"("branchId");

-- CreateIndex
CREATE INDEX "RawMaterialInventory_rawMaterialId_idx" ON "RawMaterialInventory"("rawMaterialId");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialInventory_rawMaterialId_branchId_key" ON "RawMaterialInventory"("rawMaterialId", "branchId");

-- CreateIndex
CREATE INDEX "Recipe_productId_idx" ON "Recipe"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_rawMaterialId_key" ON "RecipeIngredient"("recipeId", "rawMaterialId");

-- CreateIndex
CREATE INDEX "ProductionLog_recipeId_idx" ON "ProductionLog"("recipeId");

-- CreateIndex
CREATE INDEX "ProductionLog_branchId_idx" ON "ProductionLog"("branchId");

-- CreateIndex
CREATE INDEX "ProductionLog_createdAt_idx" ON "ProductionLog"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productionLogId_idx" ON "StockMovement"("productionLogId");

-- AddForeignKey
ALTER TABLE "RawMaterialInventory" ADD CONSTRAINT "RawMaterialInventory_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialInventory" ADD CONSTRAINT "RawMaterialInventory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "ProductionLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
