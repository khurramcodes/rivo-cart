import { z } from "zod";

const discountTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);

const baseCouponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(1000).optional(),
  discountType: discountTypeEnum,
  discountValue: z.number().int().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional(),
  minimumCartValue: z.number().int().min(0).optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  maxRedemptionsPerUser: z.number().int().min(1).optional(),
  isStackable: z.boolean().optional(),
});

export const createCouponSchema = z.object({
  body: baseCouponSchema,
});

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: baseCouponSchema.partial(),
});

export const validateCouponSchema = z.object({
  body: z.object({
    cartId: z.string().min(1),
    code: z.string().min(3).max(50),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
