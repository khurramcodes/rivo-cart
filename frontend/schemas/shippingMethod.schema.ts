import { z } from "zod";

export const shippingMethodSchema = z.object({
  type: z.enum(["STANDARD", "EXPRESS"]),
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
});

export type ShippingMethodFormData = z.infer<typeof shippingMethodSchema>;
