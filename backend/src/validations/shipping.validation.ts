import { z } from "zod";

export const quoteShippingSchema = z.object({
  body: z.object({
    addressId: z.string().min(1),
  }),
});
