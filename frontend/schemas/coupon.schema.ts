import { z } from "zod";

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .transform((v) => v.trim().toLowerCase()),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive("Discount value must be greater than 0"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  minimumCartValue: z.union([z.string(), z.number()]).transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = typeof val === "string" ? Number(val) : val;
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }).optional(),
  maxRedemptions: z.union([z.string(), z.number()]).transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = typeof val === "string" ? Number(val) : val;
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }).optional(),
  maxRedemptionsPerUser: z.union([z.string(), z.number()]).transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = typeof val === "string" ? Number(val) : val;
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }).optional(),
  isStackable: z.boolean(),
  isActive: z.boolean(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});
