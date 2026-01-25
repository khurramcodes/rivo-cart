import { z } from "zod";

export const discountSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.coerce.number<number>().positive(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    priority: z.coerce.number<number>().min(0),
    isStackable: z.boolean(),
    isActive: z.boolean(),
    scope: z.enum([
      "SITE_WIDE",
      "PRODUCT",
      "VARIANT",
      "CATEGORY",
      "COLLECTION",
    ]),
    productIds: z.array(z.string()).optional(),
    variantIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    collectionIds: z.array(z.string()).optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type DiscountFormData = z.infer<typeof discountSchema>;
