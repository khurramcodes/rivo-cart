ALTER TABLE "User"
ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lastName" TEXT;

UPDATE "User"
SET "firstName" = "name"
WHERE "firstName" = '';
