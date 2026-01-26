import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { resolveCartPricing } from "./pricing.service.js";

export async function placeOrder(
  userId: string,
  input: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    items: { productId: string; variantId: string; quantity: number }[];
  },
) {
  // Get the user's cart to check for applied coupon and calculate pricing
  const cart = await prisma.cart.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all variants with their products
  const variantIds = Array.from(new Set(input.items.map((i) => i.variantId)));
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      attributes: true,
      product: {
        select: { id: true, name: true },
      },
    },
  });

  const variantById = new Map(variants.map((v) => [v.id, v]));

  // Validate all variants exist
  for (const item of input.items) {
    if (!variantById.has(item.variantId)) {
      throw new ApiError(400, "INVALID_VARIANT", "One or more product variants are invalid");
    }
  }

  // Validate stock availability
  for (const item of input.items) {
    const variant = variantById.get(item.variantId)!;
    if (variant.stock < item.quantity) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `Insufficient stock for ${variant.product.name} (SKU: ${variant.sku}). Available: ${variant.stock}, Requested: ${item.quantity}`,
      );
    }
  }

  // Prepare order items with variant snapshots
  const normalized = input.items.map((i) => {
    const variant = variantById.get(i.variantId)!;
    const variantSnapshot: Record<string, string> = {};
    variant.attributes?.forEach((attr) => {
      variantSnapshot[attr.name] = attr.value;
    });

    return {
      productId: i.productId,
      variantId: i.variantId,
      sku: variant.sku,
      quantity: i.quantity,
      price: variant.price,
      variantSnapshot: JSON.stringify(variantSnapshot),
    };
  });

  // Calculate total using pricing engine if cart exists, otherwise use raw prices
  let totalAmount = normalized.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let appliedCouponId: string | null = null;

  if (cart) {
    try {
      const pricing = await resolveCartPricing(cart.id);
      totalAmount = pricing.discountedPrice;
      if (pricing.appliedCoupon) {
        appliedCouponId = pricing.appliedCoupon.id;
      }
    } catch {
      // If pricing fails, fall back to raw total (already calculated above)
    }
  }

  // Create order and deduct stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Deduct stock for each variant
    for (const item of normalized) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Create the order
    const created = await tx.order.create({
      data: {
        userId,
        totalAmount,
        paymentMethod: "COD",
        status: "PENDING",
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        shippingAddress: input.shippingAddress.trim(),
        items: {
          create: normalized.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            sku: i.sku,
            quantity: i.quantity,
            price: i.price,
            variantSnapshot: i.variantSnapshot,
          })),
        },
      },
      include: { items: true },
    });

    // Record coupon redemption if a coupon was applied
    if (appliedCouponId) {
      await tx.couponRedemption.create({
        data: {
          couponId: appliedCouponId,
          userId,
          orderId: created.id,
        },
      });
    }

    // Clear the cart: remove all items and reset the applied coupon
    if (cart) {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await tx.cart.update({
        where: { id: cart.id },
        data: { appliedCouponId: null },
      });
    }

    return created;
  });

  return order;
}

export async function listAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
    },
  });
}

export async function updateOrderStatus(id: string, status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED") {
  try {
    return await prisma.order.update({ where: { id }, data: { status } });
  } catch {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }
}
