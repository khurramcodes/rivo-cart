-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('SITE_WIDE', 'PRODUCT', 'VARIANT', 'CATEGORY', 'COLLECTION');

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "scope" "DiscountScope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountProducts" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "DiscountProducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountVariants" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "DiscountVariants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCategories" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "DiscountCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCollections" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "DiscountCollections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minimumCartValue" INTEGER,
    "maxRedemptions" INTEGER,
    "maxRedemptionsPerUser" INTEGER,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN "appliedCouponId" TEXT;

-- CreateIndex
CREATE INDEX "Discount_isActive_idx" ON "Discount"("isActive");

-- CreateIndex
CREATE INDEX "Discount_startDate_idx" ON "Discount"("startDate");

-- CreateIndex
CREATE INDEX "Discount_endDate_idx" ON "Discount"("endDate");

-- CreateIndex
CREATE INDEX "Discount_priority_idx" ON "Discount"("priority");

-- CreateIndex
CREATE INDEX "Discount_scope_idx" ON "Discount"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountProducts_discountId_productId_key" ON "DiscountProducts"("discountId", "productId");

-- CreateIndex
CREATE INDEX "DiscountProducts_productId_idx" ON "DiscountProducts"("productId");

-- CreateIndex
CREATE INDEX "DiscountProducts_discountId_idx" ON "DiscountProducts"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountVariants_discountId_variantId_key" ON "DiscountVariants"("discountId", "variantId");

-- CreateIndex
CREATE INDEX "DiscountVariants_variantId_idx" ON "DiscountVariants"("variantId");

-- CreateIndex
CREATE INDEX "DiscountVariants_discountId_idx" ON "DiscountVariants"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCategories_discountId_categoryId_key" ON "DiscountCategories"("discountId", "categoryId");

-- CreateIndex
CREATE INDEX "DiscountCategories_categoryId_idx" ON "DiscountCategories"("categoryId");

-- CreateIndex
CREATE INDEX "DiscountCategories_discountId_idx" ON "DiscountCategories"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCollections_discountId_collectionId_key" ON "DiscountCollections"("discountId", "collectionId");

-- CreateIndex
CREATE INDEX "DiscountCollections_collectionId_idx" ON "DiscountCollections"("collectionId");

-- CreateIndex
CREATE INDEX "DiscountCollections_discountId_idx" ON "DiscountCollections"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- CreateIndex
CREATE INDEX "Coupon_startDate_idx" ON "Coupon"("startDate");

-- CreateIndex
CREATE INDEX "Coupon_endDate_idx" ON "Coupon"("endDate");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");

-- CreateIndex
CREATE INDEX "CouponRedemption_userId_idx" ON "CouponRedemption"("userId");

-- CreateIndex
CREATE INDEX "CouponRedemption_orderId_idx" ON "CouponRedemption"("orderId");

-- CreateIndex
CREATE INDEX "CouponRedemption_redeemedAt_idx" ON "CouponRedemption"("redeemedAt");

-- CreateIndex
CREATE INDEX "Cart_appliedCouponId_idx" ON "Cart"("appliedCouponId");

-- AddForeignKey
ALTER TABLE "DiscountProducts" ADD CONSTRAINT "DiscountProducts_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProducts" ADD CONSTRAINT "DiscountProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountVariants" ADD CONSTRAINT "DiscountVariants_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountVariants" ADD CONSTRAINT "DiscountVariants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCategories" ADD CONSTRAINT "DiscountCategories_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCategories" ADD CONSTRAINT "DiscountCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCollections" ADD CONSTRAINT "DiscountCollections_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCollections" ADD CONSTRAINT "DiscountCollections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_appliedCouponId_fkey" FOREIGN KEY ("appliedCouponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
