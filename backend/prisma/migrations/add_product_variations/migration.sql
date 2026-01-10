-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SIMPLE', 'VARIABLE');

-- AlterTable Product: Add type column and make price optional (will be moved to variants)
ALTER TABLE "Product" ADD COLUMN "type" "ProductType" NOT NULL DEFAULT 'SIMPLE';
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateTable ProductVariant
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProductVariantAttribute
CREATE TABLE "ProductVariantAttribute" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariantAttribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariantAttribute_variantId_name_key" ON "ProductVariantAttribute"("variantId", "name");
CREATE INDEX "ProductVariantAttribute_variantId_idx" ON "ProductVariantAttribute"("variantId");

ALTER TABLE "ProductVariantAttribute" ADD CONSTRAINT "ProductVariantAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing products to have a default variant
-- For each existing product, create a simple variant with the product's price
INSERT INTO "ProductVariant" ("id", "productId", "sku", "price", "stock", "isDefault", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id" as "productId",
    COALESCE('SKU-' || SUBSTRING("id" FROM 1 FOR 8), 'SKU-DEFAULT') as "sku",
    "price",
    100 as "stock", -- default stock for migrated products
    true as "isDefault",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Product";

-- AlterTable OrderItem: Add variant fields
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "sku" TEXT NOT NULL DEFAULT 'MIGRATED';
ALTER TABLE "OrderItem" ADD COLUMN "variantSnapshot" TEXT;
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- Update existing order items with SKU from their product's default variant
UPDATE "OrderItem" oi
SET "sku" = pv."sku",
    "variantId" = pv."id"
FROM "ProductVariant" pv
WHERE oi."productId" = pv."productId" AND pv."isDefault" = true;

-- Now we can safely remove the price column from Product (it's in variants now)
ALTER TABLE "Product" DROP COLUMN "price";

