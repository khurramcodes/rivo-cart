-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "thumbFileId" TEXT,
ADD COLUMN     "thumbFilePath" TEXT,
ADD COLUMN     "thumbUrl" TEXT;

-- CreateTable
CREATE TABLE "ProductGalleryImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductGalleryImage_productId_idx" ON "ProductGalleryImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductGalleryImage_productId_index_key" ON "ProductGalleryImage"("productId", "index");

-- AddForeignKey
ALTER TABLE "ProductGalleryImage" ADD CONSTRAINT "ProductGalleryImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
