/*
  Warnings:

  - Added the required column `imageFileId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageFilePath` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageFileId" TEXT,
ADD COLUMN     "imageFilePath" TEXT;
