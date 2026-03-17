-- Transform existing Collection model for manual storefront collections.
ALTER TABLE "Collection" RENAME COLUMN "name" TO "title";
ALTER TABLE "Collection" ADD COLUMN "slug" TEXT;
ALTER TABLE "Collection" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

WITH normalized AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(
        regexp_replace(
          regexp_replace(lower(trim("title")), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)',
          '',
          'g'
        ),
        ''
      ),
      'collection'
    ) AS base_slug
  FROM "Collection"
),
ranked AS (
  SELECT
    "id",
    base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY "id") AS rn
  FROM normalized
)
UPDATE "Collection" c
SET "slug" =
  CASE
    WHEN r.rn = 1 THEN r.base_slug
    ELSE r.base_slug || '-' || (r.rn - 1)::text
  END
FROM ranked r
WHERE c."id" = r."id";

ALTER TABLE "Collection" ALTER COLUMN "slug" SET NOT NULL;
DROP INDEX IF EXISTS "Collection_name_key";
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

CREATE TABLE "ProductCollection" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductCollection_productId_collectionId_key" ON "ProductCollection"("productId", "collectionId");
CREATE INDEX "ProductCollection_collectionId_position_idx" ON "ProductCollection"("collectionId", "position");

ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
