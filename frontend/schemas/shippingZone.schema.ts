import { z } from "zod";

export const shippingZoneSchema = z
  .object({
    scope: z.enum(["COUNTRY", "STATE", "CITY"]),
    country: z.string().trim().optional(),
    state: z.string().trim().optional(),
    city: z.string().trim().optional(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "COUNTRY" && !data.country) {
      ctx.addIssue({ code: "custom", message: "Country is required", path: ["country"] });
    }
    if (data.scope === "STATE" && (!data.country || !data.state)) {
      if (!data.country) {
        ctx.addIssue({ code: "custom", message: "Country is required", path: ["country"] });
      }
      if (!data.state) {
        ctx.addIssue({ code: "custom", message: "State is required", path: ["state"] });
      }
    }
    if (data.scope === "CITY" && (!data.country || !data.state || !data.city)) {
      if (!data.country) {
        ctx.addIssue({ code: "custom", message: "Country is required", path: ["country"] });
      }
      if (!data.state) {
        ctx.addIssue({ code: "custom", message: "State is required", path: ["state"] });
      }
      if (!data.city) {
        ctx.addIssue({ code: "custom", message: "City is required", path: ["city"] });
      }
    }
  });

export type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;
