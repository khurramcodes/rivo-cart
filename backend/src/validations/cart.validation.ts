import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const getCartSchema = z.object({
  query: z.object({}),
});

export const addCartItemSchema = z.object({
  body: cartItemSchema,
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    quantity: z.number().int().min(0),
  }),
});

export const migrateCartSchema = z.object({
  body: z.object({
    items: z.array(cartItemSchema).min(1),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(50),
    source: z.enum(["cart", "checkout"]).optional(),
  }),
});
