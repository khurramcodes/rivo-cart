import { z } from "zod";

export const shippingRuleSchema = z
  .object({
    zoneId: z.string().min(1, "Zone is required"),
    methodId: z.string().min(1, "Method is required"),
    baseCost: z.coerce.number<number>().min(0, "Base cost must be 0 or higher"),
    priority: z.coerce.number<number>().min(0).optional(),
    isActive: z.boolean(),
    conditionType: z.enum([
      "NONE",
      "MIN_ORDER_VALUE",
      "WEIGHT_RANGE",
      "DIMENSION_RANGE",
    ]),
    minOrderValue: z.coerce.number<number>().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.conditionType === "MIN_ORDER_VALUE" &&
      data.minOrderValue == null
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Min order value is required",
        path: ["minOrderValue"],
      });
    }
  });

export type ShippingRuleFormData = z.infer<typeof shippingRuleSchema>;
