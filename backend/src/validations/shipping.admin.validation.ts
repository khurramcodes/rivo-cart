import { z } from "zod";

const scopeEnum = z.enum(["COUNTRY", "STATE", "CITY"]);
const typeEnum = z.enum(["STANDARD", "EXPRESS", "FREE"]);
const conditionEnum = z.enum(["NONE", "MIN_ORDER_VALUE", "WEIGHT_RANGE", "DIMENSION_RANGE"]);

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

const shippingZoneBodySchema = z.object({
  scope: scopeEnum,
  country: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

const validateZoneScope = (value: z.infer<typeof shippingZoneBodySchema>, ctx: z.RefinementCtx) => {
  if (value.scope === "COUNTRY" && !value.country) {
    ctx.addIssue({ code: "custom", message: "Country is required for country scope" });
  }
  if (value.scope === "STATE") {
    if (!value.country || !value.state) {
      ctx.addIssue({ code: "custom", message: "Country and state are required for state scope" });
    }
  }
  if (value.scope === "CITY") {
    if (!value.country || !value.state || !value.city) {
      ctx.addIssue({ code: "custom", message: "Country, state, and city are required for city scope" });
    }
  }
};

export const createShippingZoneSchema = z.object({
  body: shippingZoneBodySchema.superRefine(validateZoneScope),
});

export const updateShippingZoneSchema = z.object({
  params: idParamSchema.shape.params,
  body: shippingZoneBodySchema.partial().superRefine((value, ctx) => {
    if (!value.scope) return;
    validateZoneScope(value as z.infer<typeof shippingZoneBodySchema>, ctx);
  }),
});

export const createShippingMethodSchema = z.object({
  body: z.object({
    type: typeEnum,
    name: z.string().trim().min(2),
    description: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateShippingMethodSchema = z.object({
  params: idParamSchema.shape.params,
  body: createShippingMethodSchema.shape.body.partial(),
});

const shippingRuleBodySchema = z.object({
  zoneId: z.string().min(1),
  methodId: z.string().min(1),
  baseCost: z.number().int().min(0),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  conditionType: conditionEnum.optional(),
  minOrderValue: z.number().int().min(0).optional(),
});

const validateRuleCondition = (value: z.infer<typeof shippingRuleBodySchema>, ctx: z.RefinementCtx) => {
  if (value.conditionType === "MIN_ORDER_VALUE" && value.minOrderValue == null) {
    ctx.addIssue({ code: "custom", message: "minOrderValue is required for MIN_ORDER_VALUE" });
  }
};

export const createShippingRuleSchema = z.object({
  body: shippingRuleBodySchema.superRefine(validateRuleCondition),
});

export const updateShippingRuleSchema = z.object({
  params: idParamSchema.shape.params,
  body: shippingRuleBodySchema.partial().superRefine((value, ctx) => {
    if (!value.conditionType) return;
    validateRuleCondition(value as z.infer<typeof shippingRuleBodySchema>, ctx);
  }),
});
