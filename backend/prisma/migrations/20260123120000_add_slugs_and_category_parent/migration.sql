-- Add slug + hierarchy fields (nullable for backfill)
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

-- Backfill category slugs with collision handling
WITH base AS (
  SELECT
    id,
    lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'),
          '-{2,}',
          '-',
          'g'
        ),
        '(^-|-$)',
        '',
        'g'
      )
    ) AS base_slug,
    row_number() OVER (
      PARTITION BY lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'),
            '-{2,}',
            '-',
            'g'
          ),
          '(^-|-$)',
          '',
          'g'
        )
      )
      ORDER BY id
    ) AS rn
  FROM "Category"
)
UPDATE "Category" c
SET slug = CASE
  WHEN base.base_slug = '' THEN 'category-' || c.id
  WHEN base.rn = 1 THEN base.base_slug
  ELSE base.base_slug || '-' || base.rn
END
FROM base
WHERE c.id = base.id;

-- Backfill product slugs with collision handling
WITH base AS (
  SELECT
    id,
    lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'),
          '-{2,}',
          '-',
          'g'
        ),
        '(^-|-$)',
        '',
        'g'
      )
    ) AS base_slug,
    row_number() OVER (
      PARTITION BY lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'),
            '-{2,}',
            '-',
            'g'
          ),
          '(^-|-$)',
          '',
          'g'
        )
      )
      ORDER BY id
    ) AS rn
  FROM "Product"
)
UPDATE "Product" p
SET slug = CASE
  WHEN base.base_slug = '' THEN 'product-' || p.id
  WHEN base.rn = 1 THEN base.base_slug
  ELSE base.base_slug || '-' || base.rn
END
FROM base
WHERE p.id = base.id;

-- Enforce required + unique slug fields
ALTER TABLE "Category" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- Self-referencing relation for categories
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
ALTER TABLE "Category"
ADD CONSTRAINT "Category_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
