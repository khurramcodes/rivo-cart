import { z } from "zod";
export const placeOrderSchema = z.object({
    body: z.object({
        customerName: z.string().min(2).max(100),
        customerPhone: z.string().min(6).max(30),
        customerEmail: z.string().email().optional(),
        shippingAddress: z.string().min(5).max(500),
        items: z
            .array(z.object({
            productId: z.string().min(1),
            variantId: z.string().min(1),
            quantity: z.number().int().min(1).max(20),
        }))
            .min(1)
            .max(50),
    }),
});
export const updateOrderStatusSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: z.object({
        status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]),
    }),
});
