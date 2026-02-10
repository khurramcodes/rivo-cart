-- CreateEnum
CREATE TYPE "ShippingType" AS ENUM ('STANDARD', 'EXPRESS');

-- CreateEnum
CREATE TYPE "ShippingScope" AS ENUM ('COUNTRY', 'STATE', 'CITY');

-- CreateEnum
CREATE TYPE "ShippingConditionType" AS ENUM ('NONE', 'MIN_ORDER_VALUE', 'WEIGHT_RANGE', 'DIMENSION_RANGE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMethodId" TEXT;

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "scope" "ShippingScope" NOT NULL,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "type" "ShippingType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRule" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "conditionType" "ShippingConditionType" NOT NULL DEFAULT 'NONE',
    "conditionConfig" JSONB,
    "baseCost" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingZone_scope_idx" ON "ShippingZone"("scope");

-- CreateIndex
CREATE INDEX "ShippingZone_country_idx" ON "ShippingZone"("country");

-- CreateIndex
CREATE INDEX "ShippingZone_state_idx" ON "ShippingZone"("state");

-- CreateIndex
CREATE INDEX "ShippingZone_city_idx" ON "ShippingZone"("city");

-- CreateIndex
CREATE INDEX "ShippingZone_isActive_idx" ON "ShippingZone"("isActive");

-- CreateIndex
CREATE INDEX "ShippingMethod_type_idx" ON "ShippingMethod"("type");

-- CreateIndex
CREATE INDEX "ShippingMethod_isActive_idx" ON "ShippingMethod"("isActive");

-- CreateIndex
CREATE INDEX "ShippingRule_zoneId_idx" ON "ShippingRule"("zoneId");

-- CreateIndex
CREATE INDEX "ShippingRule_methodId_idx" ON "ShippingRule"("methodId");

-- CreateIndex
CREATE INDEX "ShippingRule_conditionType_idx" ON "ShippingRule"("conditionType");

-- CreateIndex
CREATE INDEX "ShippingRule_priority_idx" ON "ShippingRule"("priority");

-- CreateIndex
CREATE INDEX "ShippingRule_isActive_idx" ON "ShippingRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRule_zoneId_methodId_conditionType_priority_key" ON "ShippingRule"("zoneId", "methodId", "conditionType", "priority");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRule" ADD CONSTRAINT "ShippingRule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRule" ADD CONSTRAINT "ShippingRule_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "ShippingMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
