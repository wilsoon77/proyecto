-- CreateTable
CREATE TABLE "DailyClose" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "closeDate" DATE NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyClose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCloseItem" (
    "id" SERIAL NOT NULL,
    "dailyCloseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "reservedQty" INTEGER NOT NULL,
    "countedQty" INTEGER NOT NULL,
    "wasteQty" INTEGER NOT NULL DEFAULT 0,
    "soldQty" INTEGER NOT NULL DEFAULT 0,
    "surplusQty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyCloseItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "dailyCloseId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DailyClose_branchId_closeDate_key" ON "DailyClose"("branchId", "closeDate");
CREATE INDEX "DailyClose_closeDate_idx" ON "DailyClose"("closeDate");
CREATE INDEX "DailyClose_branchId_createdAt_idx" ON "DailyClose"("branchId", "createdAt");
CREATE UNIQUE INDEX "DailyCloseItem_dailyCloseId_productId_key" ON "DailyCloseItem"("dailyCloseId", "productId");
CREATE INDEX "DailyCloseItem_productId_idx" ON "DailyCloseItem"("productId");
CREATE INDEX "StockMovement_dailyCloseId_idx" ON "StockMovement"("dailyCloseId");

-- AddForeignKey
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyClose" ADD CONSTRAINT "DailyClose_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DailyCloseItem" ADD CONSTRAINT "DailyCloseItem_dailyCloseId_fkey" FOREIGN KEY ("dailyCloseId") REFERENCES "DailyClose"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyCloseItem" ADD CONSTRAINT "DailyCloseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_dailyCloseId_fkey" FOREIGN KEY ("dailyCloseId") REFERENCES "DailyClose"("id") ON DELETE SET NULL ON UPDATE CASCADE;
