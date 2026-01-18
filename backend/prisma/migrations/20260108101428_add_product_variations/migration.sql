DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'OrderItem'
      AND column_name = 'sku'
  ) THEN
    ALTER TABLE "OrderItem" ALTER COLUMN "sku" DROP DEFAULT;
  END IF;
END $$;
