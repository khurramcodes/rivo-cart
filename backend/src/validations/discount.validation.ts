import { z } from "zod";

const discountTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);
const discountScopeEnum = z.enum(["SITE_WIDE", "PRODUCT", "VARIANT", "CATEGORY", "COLLECTION"]);

const baseDiscountSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  discountType: discountTypeEnum,
  discountValue: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  isStackable: z.boolean().optional(),
  scope: discountScopeEnum,
  productIds: z.array(z.string().min(1)).optional(),
  variantIds: z.array(z.string().min(1)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  collectionIds: z.array(z.string().min(1)).optional(),
});

export const createDiscountSchema = z.object({
  body: baseDiscountSchema,
});

export const updateDiscountSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: baseDiscountSchema.partial(),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
