-- CreateTable
CREATE TABLE "DemandDaily" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "businessDate" DATE NOT NULL,
    "orderQty" INTEGER NOT NULL DEFAULT 0,
    "dailyCloseQty" INTEGER NOT NULL DEFAULT 0,
    "totalDemandQty" INTEGER NOT NULL DEFAULT 0,
    "productionQty" INTEGER NOT NULL DEFAULT 0,
    "wasteQty" INTEGER NOT NULL DEFAULT 0,
    "stockout" BOOLEAN NOT NULL DEFAULT false,
    "dataQuality" TEXT NOT NULL DEFAULT 'NO_DATA',
    "sourceBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastRun" (
    "id" SERIAL NOT NULL,
    "branchId" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "horizonDays" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "errorMessage" TEXT,
    "parameters" JSONB,

    CONSTRAINT "ForecastRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastItem" (
    "id" SERIAL NOT NULL,
    "forecastRunId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "forecastDate" DATE NOT NULL,
    "predictedQty" DOUBLE PRECISION NOT NULL,
    "lowerBound" DOUBLE PRECISION NOT NULL,
    "upperBound" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "recommendedProductionQty" INTEGER NOT NULL DEFAULT 0,
    "recommendedTrays" INTEGER,
    "rawMaterialRisk" JSONB,

    CONSTRAINT "ForecastItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DemandDaily_branchId_productId_businessDate_key" ON "DemandDaily"("branchId", "productId", "businessDate");
CREATE INDEX "DemandDaily_branchId_businessDate_idx" ON "DemandDaily"("branchId", "businessDate");
CREATE INDEX "DemandDaily_productId_businessDate_idx" ON "DemandDaily"("productId", "businessDate");
CREATE INDEX "DemandDaily_businessDate_idx" ON "DemandDaily"("businessDate");
CREATE INDEX "ForecastRun_branchId_generatedAt_idx" ON "ForecastRun"("branchId", "generatedAt");
CREATE INDEX "ForecastRun_branchId_status_generatedAt_idx" ON "ForecastRun"("branchId", "status", "generatedAt");
CREATE UNIQUE INDEX "ForecastItem_forecastRunId_productId_forecastDate_key" ON "ForecastItem"("forecastRunId", "productId", "forecastDate");
CREATE INDEX "ForecastItem_productId_forecastDate_idx" ON "ForecastItem"("productId", "forecastDate");
CREATE INDEX "ForecastItem_forecastRunId_forecastDate_idx" ON "ForecastItem"("forecastRunId", "forecastDate");

-- AddForeignKey
ALTER TABLE "DemandDaily" ADD CONSTRAINT "DemandDaily_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandDaily" ADD CONSTRAINT "DemandDaily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForecastRun" ADD CONSTRAINT "ForecastRun_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForecastItem" ADD CONSTRAINT "ForecastItem_forecastRunId_fkey" FOREIGN KEY ("forecastRunId") REFERENCES "ForecastRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForecastItem" ADD CONSTRAINT "ForecastItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
