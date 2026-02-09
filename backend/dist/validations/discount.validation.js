import { z } from "zod";
const discountTypeEnum = z.enum(["PERCENTAGE", "FIXED"]);
const discountScopeEnum = z.enum(["SITE_WIDE", "PRODUCT", "VARIANT", "CATEGORY", "COLLECTION"]);
const baseDiscountObject = z.object({
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
const percentageMaxRefine = (data) => data.discountType !== "PERCENTAGE" ||
    data.discountValue === undefined ||
    data.discountValue <= 100;
const baseDiscountSchema = baseDiscountObject.refine(percentageMaxRefine, {
    message: "Percentage discount cannot exceed 100%",
    path: ["discountValue"],
});
export const createDiscountSchema = z.object({
    body: baseDiscountSchema,
});
export const updateDiscountSchema = z.object({
    params: z.object({ id: z.string().min(1) }),
    body: baseDiscountObject.partial().refine(percentageMaxRefine, {
        message: "Percentage discount cannot exceed 100%",
        path: ["discountValue"],
    }),
});
export const idParamSchema = z.object({
    params: z.object({ id: z.string().min(1) }),
});
