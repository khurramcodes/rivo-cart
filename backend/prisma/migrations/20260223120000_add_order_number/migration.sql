-- CreateSequence
-- Used for concurrency-safe, unique order numbers (ORD-0001, ORD-0002, ...)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- AlterTable: add orderNumber column as nullable first for backward compatibility
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;

-- Backfill: assign sequential order numbers to existing rows (each nextval() runs per row)
UPDATE "Order"
SET "orderNumber" = 'ORD-' || LPAD(nextval('order_number_seq')::text, 4, '0')
WHERE "orderNumber" IS NULL;

-- Enforce NOT NULL and UNIQUE
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderNumber_key" UNIQUE ("orderNumber");

-- Index for lookups by orderNumber
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");
