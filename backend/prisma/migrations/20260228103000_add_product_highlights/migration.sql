-- CreateTable
CREATE TABLE "ProductHighlight" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductHighlight_productId_idx" ON "ProductHighlight"("productId");

-- CreateIndex
CREATE INDEX "ProductHighlight_productId_sortOrder_idx" ON "ProductHighlight"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProductHighlight"
ADD CONSTRAINT "ProductHighlight_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
