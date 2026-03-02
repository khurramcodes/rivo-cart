-- Category: add imageFileKey, migrate, drop old columns
ALTER TABLE "Category" ADD COLUMN "imageFileKey" TEXT;
UPDATE "Category" SET "imageFileKey" = "imageFilePath" WHERE "imageFilePath" IS NOT NULL;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "imageFileId";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "imageFilePath";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "imageFolderPath";

-- Product: add imageFileKey, migrate, drop old columns
ALTER TABLE "Product" ADD COLUMN "imageFileKey" TEXT;
UPDATE "Product" SET "imageFileKey" = "imageFilePath" WHERE "imageFilePath" IS NOT NULL;
ALTER TABLE "Product" DROP COLUMN IF EXISTS "imageFileId";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "imageFilePath";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "imageFolderPath";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "thumbFileId";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "thumbFilePath";

-- ProductGalleryImage: add fileKey, migrate, drop old columns
ALTER TABLE "ProductGalleryImage" ADD COLUMN "fileKey" TEXT;
UPDATE "ProductGalleryImage" SET "fileKey" = "filePath";
ALTER TABLE "ProductGalleryImage" ALTER COLUMN "fileKey" SET NOT NULL;
ALTER TABLE "ProductGalleryImage" DROP COLUMN "fileId";
ALTER TABLE "ProductGalleryImage" DROP COLUMN "filePath";
